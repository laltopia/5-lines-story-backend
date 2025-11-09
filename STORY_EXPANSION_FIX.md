# Story Expansion Implementation - Bug Fixes

## Problem Summary

The story expansion feature (5→10→15→20 lines) was implemented in both frontend and backend, but had critical bugs preventing it from working:

### Issues Found:

1. **Missing Metadata Extraction in `/generate-story` endpoint**
   - New stories were created WITHOUT metadata extraction
   - Fields `story_level`, `accumulated_metadata`, `user_inputs_history`, and `parent_story_id` were not being saved
   - This caused all stories to have NULL/empty values in expansion-related fields

2. **Incompatible Response Format in `/expand-story` endpoint**
   - Backend returned: `{ expandedStory: {...}, metadata: { storyLevel: 10, ... } }`
   - Frontend expected: `{ story: {...}, storyLevel: 10, parentStoryId: "...", ... }`
   - This caused the frontend to fail when trying to render expanded stories

3. **Database Migration**
   - Migration `database/add_story_expansion_support.sql` was already executed ✓
   - All required columns exist in the database

---

## Changes Made

### 1. Fixed `/api/ai/generate-story` Endpoint (backend/routes/ai.js)

**BEFORE:**
```javascript
router.post('/generate-story', async (req, res) => {
  // ... generate story ...

  await supabase.from('conversations').insert([{
    user_input: userInput,
    ai_response: JSON.stringify(storyData.story),
    title: storyTitle,
    // ... other fields ...
    // ❌ Missing: story_level, accumulated_metadata, user_inputs_history, parent_story_id
  }]);

  res.json({
    success: true,
    story: storyData.story,
    conversationId: conversationData.id,
    // ❌ Missing: storyLevel, accumulatedMetadata
  });
});
```

**AFTER:**
```javascript
router.post('/generate-story', async (req, res) => {
  // STEP 1: Extract metadata from user input
  const metadataPrompt = getPrompt('extract_metadata');
  const { content: metadataContent, usage: metadataUsage } =
    await callClaude(metadataPrompt, metadataUserMessage);

  const extractedMetadata = JSON.parse(metadataContent);

  // Build accumulated metadata
  const accumulatedMetadata = {
    characters: extractedMetadata.newCharacters || [],
    settings: extractedMetadata.newSettings || [],
    keyFacts: extractedMetadata.newFacts || [],
    emotionalThemes: extractedMetadata.newEmotionalThemes || [],
    tone: extractedMetadata.tone || 'neutral',
    language: detectLanguage(sanitizedInput)
  };

  // Build user inputs history
  const userInputsHistory = [{
    inputNumber: 1,
    storyLevel: 5,
    rawInput: userInput,
    inputType: inputType || 'text',
    extractedMetadata: extractedMetadata,
    timestamp: new Date().toISOString()
  }];

  // STEP 2: Generate story
  // ... story generation code ...

  // STEP 3: Save with expansion metadata
  await supabase.from('conversations').insert([{
    user_input: userInput,
    ai_response: JSON.stringify(storyData.story),
    title: storyTitle,
    // ... other fields ...
    // ✅ EXPANSION SUPPORT FIELDS
    story_level: 5,
    parent_story_id: null,
    accumulated_metadata: accumulatedMetadata,
    user_inputs_history: userInputsHistory
  }]);

  res.json({
    success: true,
    story: storyData.story,
    conversationId: conversationData.id,
    // ✅ Include expansion fields
    storyLevel: 5,
    parentStoryId: null,
    accumulatedMetadata: accumulatedMetadata
  });
});
```

**What Changed:**
- ✅ Added metadata extraction step using `extract_metadata` prompt
- ✅ Build `accumulatedMetadata` object from extracted metadata
- ✅ Build `userInputsHistory` array with first input
- ✅ Save `story_level = 5`, `parent_story_id = null`, `accumulated_metadata`, and `user_inputs_history` to database
- ✅ Include `storyLevel`, `parentStoryId`, and `accumulatedMetadata` in response
- ✅ Updated token counting to include metadata extraction tokens

---

### 2. Fixed `/api/ai/expand-story` Response Format (backend/routes/ai.js)

**BEFORE:**
```javascript
res.json({
  success: true,
  expandedStory: storyLines,  // ❌ Frontend expects "story"
  metadata: {
    storyLevel: targetLevel,   // ❌ Frontend expects at root level
    parentStoryId: conversationId,  // ❌ Frontend expects at root level
    // ...
  },
  conversationId: newConversation.id
});
```

**AFTER:**
```javascript
res.json({
  success: true,
  story: storyLines,  // ✅ Frontend expects "story"
  storyLevel: targetLevel,  // ✅ At root level
  parentStoryId: conversationId,  // ✅ At root level
  conversationId: newConversation.id,
  accumulatedMetadata: accumulatedMetadata,
  metadata: {
    fromLevel: currentLevel,
    toLevel: targetLevel,
    distribution: getBeatDistribution(targetLevel).join('-'),
    language: accumulatedMetadata.language,
    tone: expandedStory.metadata?.tone || accumulatedMetadata.tone
  }
});
```

**What Changed:**
- ✅ Renamed `expandedStory` → `story` to match frontend expectations
- ✅ Moved `storyLevel` and `parentStoryId` to root level
- ✅ Added `accumulatedMetadata` at root level
- ✅ Kept detailed metadata in nested `metadata` object

---

## How Story Expansion Works Now

### Flow: Creating a 5-Line Story

1. **User enters story idea**: "I want to write about a filmmaker's journey"
2. **Backend extracts metadata**: Characters, settings, facts, themes, tone, language
3. **Backend generates 5-line story**: Using the `generate_story` prompt
4. **Backend saves to database**:
   ```json
   {
     "user_input": "I want to write about a filmmaker's journey",
     "ai_response": "{\"line1\": \"...\", \"line2\": \"...\", ...}",
     "story_level": 5,
     "parent_story_id": null,
     "accumulated_metadata": {
       "characters": [{"name": "João", "role": "filmmaker"}],
       "settings": [{"location": "São Paulo"}],
       "keyFacts": ["struggling for 3 years"],
       "emotionalThemes": ["self-doubt", "perseverance"],
       "tone": "inspirational",
       "language": "pt"
     },
     "user_inputs_history": [
       {
         "inputNumber": 1,
         "storyLevel": 5,
         "rawInput": "I want to write about a filmmaker's journey",
         "inputType": "text",
         "extractedMetadata": {...},
         "timestamp": "2025-11-09T18:30:00Z"
       }
     ]
   }
   ```

5. **Frontend displays**:
   - The 5-line story
   - Badge showing "5-Line Story"
   - Button "Expand to 10-Line Story" ✨

### Flow: Expanding from 5→10 Lines

1. **User clicks "Expand to 10-Line Story"**
2. **Modal opens**: User provides additional context (e.g., "Add more about his childhood")
3. **Backend receives expansion request**:
   ```json
   {
     "conversationId": "uuid-of-5-line-story",
     "targetLevel": 10,
     "userInput": "Add more about his childhood",
     "inputType": "text"
   }
   ```

4. **Backend expands the story**:
   - Fetches the current 5-line story
   - Validates expansion path (5→10 is valid)
   - Extracts metadata from new user input
   - Merges with accumulated metadata
   - Generates 10-line story using expansion prompt
   - Saves as NEW conversation with:
     - `story_level = 10`
     - `parent_story_id = uuid-of-5-line-story`
     - Updated `accumulated_metadata`
     - Updated `user_inputs_history`

5. **Frontend receives response** and displays:
   - The 10-line story
   - Badge showing "10-Line Story"
   - Button "Expand to 15-Line Story" ✨

### Flow: Lineage Tracking

Stories form a parent-child relationship:
```
5-Line Story (ID: abc123)
  ↓
10-Line Story (ID: def456, parent_story_id: abc123)
  ↓
15-Line Story (ID: ghi789, parent_story_id: def456)
  ↓
20-Line Story (ID: jkl012, parent_story_id: ghi789)
```

---

## Testing the Fix

### Test Case 1: Create New Story
1. Go to `/ai.html`
2. Enter a story idea
3. Generate paths and create story
4. **Expected**:
   - Story created successfully
   - Badge shows "5-Line Story"
   - "Expand to 10-Line Story" button appears
   - Database should have `story_level=5`, `accumulated_metadata` populated

### Test Case 2: Expand Story (5→10)
1. Create a 5-line story
2. Click "Expand to 10-Line Story"
3. Enter expansion context (e.g., "Add more about the character's background")
4. Click "Expand Story"
5. **Expected**:
   - Loading notification appears
   - Story expands to 10 lines
   - Badge shows "10-Line Story"
   - "Expand to 15-Line Story" button appears
   - New conversation created in database with `story_level=10`, `parent_story_id` set

### Test Case 3: View Story in History
1. Go to `/history.html`
2. Find your story
3. Click to open modal
4. **Expected**:
   - Story displays with level badge (5, 10, 15, or 20)
   - If not at max level, "Expand" button appears
   - Clicking expand works from history page too

### Test Case 4: Full Expansion Chain (5→10→15→20)
1. Create a 5-line story
2. Expand to 10 lines
3. Expand to 15 lines
4. Expand to 20 lines
5. **Expected**:
   - Each expansion creates a new conversation
   - Each has correct `story_level` and `parent_story_id`
   - At 20 lines, "Maximum Level Reached" badge shows
   - No more expand button

---

## Database Verification

Check if metadata is being saved:

```sql
-- Check recent stories
SELECT
  id,
  story_level,
  parent_story_id,
  accumulated_metadata,
  user_inputs_history,
  created_at
FROM conversations
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 5;

-- Check expansion chain
SELECT
  c1.id AS story_5_lines,
  c2.id AS story_10_lines,
  c3.id AS story_15_lines,
  c4.id AS story_20_lines
FROM conversations c1
LEFT JOIN conversations c2 ON c2.parent_story_id = c1.id AND c2.story_level = 10
LEFT JOIN conversations c3 ON c3.parent_story_id = c2.id AND c3.story_level = 15
LEFT JOIN conversations c4 ON c4.parent_story_id = c3.id AND c4.story_level = 20
WHERE c1.story_level = 5
  AND c1.user_id = 'your-user-id'
ORDER BY c1.created_at DESC;
```

---

## Files Modified

1. `backend/routes/ai.js`:
   - Line ~200-385: Fixed `/generate-story` endpoint
   - Line ~1314-1335: Fixed `/expand-story` response format

---

## Next Steps

1. ✅ Changes committed to git
2. ✅ Changes pushed to branch
3. Test the expansion flow manually
4. Monitor for any errors in production logs
5. Verify metadata is being extracted correctly
6. Test all expansion paths (5→10→15→20)

---

## Known Limitations

- Metadata extraction quality depends on user input quality
- Expansion works best when user provides meaningful context
- Maximum story level is 20 lines (by design)
- Each expansion creates a new conversation (separate database row)

---

## Related Files

- Frontend: `public/ai.js` (lines 514-1416)
- Frontend: `public/history.js` (lines 377-1041)
- Backend: `backend/routes/ai.js` (lines 200-1345)
- Database: `database/add_story_expansion_support.sql`
- Prompts: `backend/config/prompts.js` (expansion prompts)
