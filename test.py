import os
import time

import requests

# ==== CONFIG ====
API_KEY="AIzaSyAWREu3BaSKgFEo6gLDXBuNFUn8C-oJSzg"
VIDEO_FILE = "sample.mp4"  # change if needed
MODEL = "gemini-2.5-flash"   # or gemini-1.5-flash

if not API_KEY:
    raise RuntimeError("❌ Missing GEMINI_API_KEY environment variable")

UPLOAD_URL = f"https://generativelanguage.googleapis.com/upload/v1beta/files?key={API_KEY}"
FILES_BASE = "https://generativelanguage.googleapis.com/v1beta"

def get_file_json(file_name: str) -> dict:
    url = f"{FILES_BASE}/{file_name}?key={API_KEY}"
    r = requests.get(url)
    try:
        data = r.json()
    except Exception:
        raise RuntimeError(f"❌ Non-JSON response while checking file: {r.text}")

    if "error" in data:
        raise RuntimeError(f"❌ Error checking file state: {data}")
    return data

def extract_state_and_uri(file_json: dict):
    """
    Google returns either:
      { "file": { ... "state": "ACTIVE", "uri": ".../files/xyz" } }
    or:
      { "name": "files/xyz", "state": "ACTIVE", "uri": ".../files/xyz", ... }
    Handle both.
    """
    fobj = file_json.get("file", file_json)
    state = fobj.get("state")
    uri = fobj.get("uri")
    name = fobj.get("name")  # e.g. "files/xyz"
    return state, uri, name

def poll_until_active(file_name: str, max_wait_sec: int = 180):
    delay = 2
    waited = 0
    while True:
        data = get_file_json(file_name)
        state, uri, _ = extract_state_and_uri(data)
        if state == "ACTIVE":
            print("✅ File is ACTIVE")
            return uri
        if state == "FAILED":
            raise RuntimeError("❌ File processing failed in Gemini API")
        print(f"📡 File state: {state or 'UNKNOWN'} — rechecking in {delay}s...")
        time.sleep(delay)
        waited += delay
        if waited >= max_wait_sec:
            raise RuntimeError("⏰ Timeout: file never became ACTIVE")
        delay = min(delay * 2, 10)  # exponential backoff, capped

# ==== 1) Upload the video ====
with open(VIDEO_FILE, "rb") as f:
    print("📤 Uploading video...")
    up = requests.post(UPLOAD_URL, files={"file": f})

if up.status_code != 200:
    raise RuntimeError(f"❌ Upload failed: {up.text}")

up_json = up.json()
print("✅ Upload complete:", up_json)

uploaded = up_json.get("file", up_json)
file_name = uploaded["name"]             # e.g. "files/abc123"
initial_state = uploaded.get("state", "UNKNOWN")
print(f"⏳ File state = {initial_state}. Waiting for ACTIVE...")

# ==== 2) Poll until ACTIVE ====
file_uri = poll_until_active(file_name)

# ==== 3) Call Gemini with SYSTEM PROMPT ====
generate_url = f"{FILES_BASE}/models/{MODEL}:generateContent?key={API_KEY}"

payload = {
    "systemInstruction": {
        "parts": [{
            "text": (
                """You are an expert communication coach. Analyze the following speaker's speech and evaluate their speaking style based on the criteria below. **Provide both** a written evaluation **and** a **structured JSON** summary of your findings, including scores (1-10) for each sub-criterion.

**1. Voice & Sound Qualities:** Evaluate the speaker's vocal delivery, covering:  
- **Pitch/Tone:** (e.g. high, low, monotone, varied, singsong) – *Score 1-10*  
- **Volume:** (e.g. soft, loud, fluctuating, steady) – *Score 1-10*  
- **Tempo/Pace:** (e.g. fast, slow, variable) – *Score 1-10*  
- **Rhythm/Cadence:** (e.g. smooth, choppy, lyrical, staccato) – *Score 1-10*  
- **Clarity/Articulation:** (e.g. crisp, slurred, mumbled, precise) – *Score 1-10*  
- **Pausing/Hesitation:** (e.g. frequent pauses, filler words "uh/um", fluent flow) – *Score 1-10*  
- **Prosody (Intonation/Emotional coloring):** (e.g. expressive, flat) – *Score 1-10*  

For each of the above, comment on the speaker’s performance and give a score from 1 (needs improvement) to 10 (excellent). If certain vocal qualities **cannot be determined from the provided input** (for instance, if you only have text transcript without audio), **note this limitation** in your comment.

**2. Word Choice & Vocabulary:** Examine the speaker’s choice of words:  
- **Formality Level:** (formal, casual, slangy, technical) – *Score 1-10*  
- **Vocabulary Complexity:** (simple vs. complex words, jargon use) – *Score 1-10*  
- **Repetition of Words/Phrases:** (e.g. reusing phrases, catchphrases) – *Score 1-10*  
- **Directness and Clarity:** (straightforward vs. vague or roundabout) – *Score 1-10*  
- **Emotional Tone of Words:** (optimistic, critical, empathetic, neutral, etc.) – *Score 1-10*  

Provide observations on their word choice (e.g. Are they using simple language? Do they rely on filler phrases or jargon? Is the tone of their language positive or negative?) and score each sub-criterion.

**3. Sentence Structure & Narrative Style:** Analyze how they construct sentences and convey ideas:  
- **Sentence Length & Structure:** (short/concise vs. long/winding; proper grammar or run-ons/fragments) – *Score 1-10*  
- **Narrative Style:** (e.g. storytelling, explanatory, persuasive, descriptive) – *Score 1-10*  
- **Use of Questions:** (do they ask rhetorical questions, clarifying questions, etc.?) – *Score 1-10*  
- **Use of Metaphors/Analogies:** (frequent, occasional, or none) – *Score 1-10*  

Comment on how the speaker’s sentences flow and their overall style of narration or explanation, with scores for each aspect.

**4. Conversational Style:** Evaluate their interactive communication approach:  
- **Turn-Taking:** (do they interrupt or allow others to speak? if applicable) – *Score 1-10*  
- **Responsiveness/Relevance:** (stay on-topic vs. tangents, answer questions directly or evade) – *Score 1-10*  
- **Politeness & Etiquette:** (use of “please,” “thank you,” polite tone, hedging) – *Score 1-10*  
- **Assertiveness:** (confident and decisive vs. hesitant or deferential) – *Score 1-10*  
- **Humor/Playfulness:** (serious, witty, dry, sarcastic, etc.) – *Score 1-10*  
- **Form of Address:** (how they address others – formally by title, casually by name, or using “you”) – *Score 1-10*  

Give feedback on how the speaker engages in a conversation or talk. If the speech is not interactive (e.g., a monologue), note the style in which they present themselves (formal vs. casual, humorous or serious, etc.).

**5. Non-verbal/Paralinguistic Cues (if observable):** Assess any non-verbal elements accompanying the speech (note: this requires video or detailed observation, otherwise mention that these cues are not available):  
- **Laughter/Chuckling:** (Did they laugh or chuckle? Was it appropriate?) – *Score 1-10*  
- **Sighs/Breaths:** (Noticeable sighing or heavy breathing?) – *Score 1-10*  
- **Gestures:** (Do they use hand gestures? Are they emphatic or minimal?) – *Score 1-10*  
- **Facial Expressions:** (Are expressions aligned with the content? Smiling, frowning, etc.?) – *Score 1-10*  

If a video is provided, describe these behaviors and how they affect the speech. If **no visual information** is provided, state that you **cannot evaluate this section**, and/or base it on any indirect cues from the audio if possible.

**6. Overall Impression:** Summarize the speaker’s overall communication effectiveness:  
- **Warmth/Approachability:** (do they seem friendly and approachable?) – *Score 1-10*  
- **Authority/Credibility:** (do they sound confident and credible?) – *Score 1-10*  
- **Charisma/Engagement:** (are they engaging, charismatic, able to hold attention?) – *Score 1-10*  
- **Consistency/Adaptability:** (do they maintain a consistent style? do they adapt their tone depending on context or topic?) – *Score 1-10*  

Provide a brief **overall evaluation** describing the general impression the speaker gives. Highlight strengths (what they do well) and areas for improvement. If relevant, note whether they adapt their speaking style appropriately for the context or audience. Finally, give an **overall summary comment** about their speaking style and effectiveness (this can be a short paragraph).

**7. Filler Words and Repeated Phrases (Disfluency Analysis):**  
In a separate section of your response, analyze the speaker's use of filler words and any frequently repeated phrases:
  - List common **filler words** used (e.g., "um", "uh", "like", "you know") and **how many times** each occurred. If a transcript with timestamps is available, include **timestamps** for a few occurrences of each filler (e.g., when in the video they happen).  
  - Identify any **phrases or sentences** the speaker tends to repeat (e.g., a catchphrase or a repeated transition like "So, basically..."). Provide examples of these repeated phrases and their **timestamps** or approximate positions in the speech.

If no transcript timestamps are available, you can indicate the frequency (count) and relative position (e.g., "frequently throughout the talk" or "mostly at the beginning") instead of exact times.

**Output Format Instructions:**  
- Your primary output should be a single, well-structured JSON object containing the entire evaluation. This JSON should be the first thing you output.
- The JSON object must include all categories (1-6) and their sub-criteria, each with a "score" (1-10) and a brief "comment".
- Include the "Disfluency Analysis" (category 7) within the JSON, detailing filler words and repeated phrases with counts and timestamps if available.
- After the JSON object, provide a brief, high-level **written summary** (2-3 paragraphs) of the speaker's key strengths and most critical areas for improvement. Do not repeat all the details from the JSON.
- Ensure the JSON is valid and can be parsed by a program.

Make the tone of your evaluation **constructive and objective**. Be sure to **praise** the speaker's strengths and **gently point out** areas that could be improved, using an encouraging tone. If some criteria cannot be evaluated due to lack of data (e.g., no audio for voice pitch, or no video for gestures), clearly state that those aspects are **not determinable from the given input**.

Now, proceed with the evaluation based on the provided material.


Global 1–10 scale (applies to every sub-criterion)

1: severely impairs understanding; frequent errors; distracting throughout

3: below average; issues common and noticeable

5: acceptable/typical; issues present but manageable

7: strong; infrequent, minor issues; mostly intentional control

9: exemplary; precise, intentional, and adapted to context
(Use 2/4/6/8/10 via interpolation; 10 reserved for truly outstanding samples.)

Anchors by sub-criterion (examples the model should look for)
1) Voice & Sound Qualities

Pitch/Tone

1: rigid monotone; no emphasis; emotional flatness

3: mostly flat; rare rise/fall; emphasis feels accidental

5: some variation at clause ends; occasional emphasis

7: varied contour highlights key words; supports meaning

9: dynamic, deliberate pitch shaping matching content

Volume

1: very soft or clipped; frequent inaudible segments

3: soft; drops at sentence ends; uneven projection

5: mostly steady “indoor voice”; occasional dips

7: controlled projection; deliberate emphasis peaks

9: precise level management across rooms & distances

Tempo/Pace

1: rushed or dragging to the point of confusion

3: often too fast/slow; hard to track key points

5: generally comfortable; minor drift in long turns

7: adapts speed to complexity; slows for emphasis

9: expert modulation responding to audience cues

Rhythm/Cadence

1: choppy/staccato; broken phrases; awkward phrasing

3: irregular rhythm; many mid-thought stops

5: mostly smooth; occasional stutter or restart

7: lyrical flow; clear phrase boundaries

9: polished cadence; musical phrasing enhances recall

Clarity/Articulation

1: frequent mumbling/slurring; words lost

3: dropped consonants; muddied clusters (“str”, “pl”)

5: generally crisp; a few mashed syllables

7: clean diction incl. difficult clusters

9: broadcast-quality articulation, effortless intelligibility

Pausing/Hesitation

1: constant “uh/um”; stalls mid-phrase

3: frequent fillers (>3/min); awkward long pauses

5: some fillers; functional pause use

7: purposeful pauses; minimal fillers

9: strategic pausing drives emphasis; near-zero fillers

Prosody (intonation/emotion)

1: flat affect; emotion mismatched to content

3: limited intonation; occasional mismatch

5: some emotional coloring; mostly appropriate

7: clear, supportive emotional shading

9: nuanced prosody heightens impact

2) Word Choice & Vocabulary

Formality level

1: inappropriate slang/expletives for context

3: casually colloquial where neutral is expected

5: context-appropriate neutral register

7: consistently matches audience norms

9: deft code-switching across contexts

Complexity

1: oversimplified; vague placeholders (“stuff”, “things”)

3: simple words with imprecision; undefined jargon

5: balanced simple/technical; defines terms

7: precise terminology with quick scaffolding

9: sophisticated yet accessible phrasing/paraphrase

Repetition

1: mantras/catchphrases every minute

3: noticeable repeats substitute for content

5: some reuse for cohesion; not distracting

7: intentional repetition for rhetoric/signposting

9: varied phrasing; repetition only for impact

Directness

1: evasive; heavy hedging; unclear asks

3: roundabout; buries the point

5: mostly clear claims/requests

7: crisp, unambiguous statements

9: concise, high signal-to-noise

Emotional tone (lexical)

1: abrasive/inappropriate for setting

3: uneven tone; swings without reason

5: mostly neutral/appropriate

7: empathetic/positive where fitting

9: finely tuned tone that guides reception

3) Sentence & Structure

Sentence length

1: rambling chains; no breath points

3: frequent run-ons or fragments

5: mix of short/medium; mostly readable

7: deliberate variety for emphasis

9: surgical sentence design for effect

Grammar & syntax

1: errors regularly impede meaning

3: several noticeable errors

5: minor slips; meaning clear

7: clean, controlled syntax

9: polished grammar incl. stylistic choices

Narrative style

1: aimless; no structure or throughline

3: listy/patchy; weak transitions

5: clear begin–middle–end

7: purposeful arcs and segues

9: compelling narrative framing

Use of questions

1: none or irrelevant questions

3: occasional rhetorical without purpose

5: some clarifying/engaging questions

7: probing & rhetorical to guide audience

9: masterful questioning drives discovery

Metaphors/analogies

1: none or confusing comparisons

3: rare/simple; limited help

5: occasional clear analogies

7: helpful metaphors that clarify abstractions

9: memorable analogies elevate message

4) Conversational Style

Turn-taking

1: constant interruptions; ignores cues

3: often overtalks; slow to yield

5: mostly balanced handoffs

7: attentive timing; invites others in

9: models active listening; seamless turns

Responsiveness

1: ignores prompts; answers unrelated

3: tangents derail answers

5: answers with mild drift

7: answers directly, then expands

9: anticipates needs; laser-aligned

Politeness markers

1: rude/disrespectful language

3: rarely polite; abrupt tone

5: routine please/thanks; basic etiquette

7: courteous hedging with clarity

9: gracious and culturally sensitive

Assertiveness

1: apologetic; won’t take a stance

3: heavy qualifiers (“maybe”, “sort of”)

5: balanced confidence vs. openness

7: clear stance; respectful delivery

9: authoritative without domineering

Humor/playfulness

1: inappropriate/offensive attempts

3: flat or forced jokes

5: light, safe levity

7: witty as seasoning, not filler

9: deft humor deepens rapport

Form of address

1: misuses names/titles; alienating

3: inconsistent address forms

5: appropriate and consistent

7: adapts formality per person

9: frames relationships skillfully

5) Non-verbal / Paralinguistic (video/audio)

Laughter/chuckling

1: nervous or ill-timed; undermines points

3: occasional misplaced laughs

5: appropriate mild chuckles

7: enhances warmth/bonding

9: calibrates room energy expertly

Sighs/breaths

1: audible sighs/panting; distracting

3: frequent mouth-breathing/noise

5: generally unobtrusive breaths

7: controlled breath supports phrasing

9: breath mastery shapes cadence

Gestures

1: fidgeting; distracts from message

3: minimal or mismatched gestures

5: simple supportive hand motions

7: purposeful, synchronized emphasis

9: expressive anchors for key points

Facial expressions

1: mismatched affect (smiles at bad news)

3: flat/limited expression

5: generally aligned with content

7: expressive and congruent

9: nuanced cues guide attention

6) Overall Impression

Warmth/approachability

1: aloof; uninviting

3: limited warmth

5: approachable enough

7: friendly, easy to engage

9: highly empathetic connection

Authority/credibility

1: uncertain; factual slips

3: low confidence; weak support

5: competent baseline

7: confident, evidence-backed

9: trusted expert presence

Charisma/engagement

1: dull; loses attention quickly

3: uneven pull; energy dips

5: holds attention adequately

7: energizing; compelling moments

9: magnetic and memorable

Consistency/adaptability

1: inconsistent; ignores context

3: minor mismatches to audience

5: mostly consistent style

7: adapts tone to topic/audience

9: fluid tailoring in real time
"""
            )
        }]},
    "contents": [{
        "parts": [
            {"file_data": {"file_uri": file_uri}},
            {"text": "Evaluate the speaker according to your role."}
        ]
    }],
    "generationConfig": {
        "responseMimeType": "application/json",
        "responseSchema": {
            "type": "object",
            "required": ["video_id", "scores", "disfluencies", "summary"],
            "properties": {
                "video_id": {
                    "type": "string"
                },
                "scores": {
                    "type": "object",
                    "required": ["voice_sound", "word_choice", "sentence_structure", "conversational_style", "nonverbal", "overall_impression"],
                    "properties": {
                        "voice_sound": {
                            "type": "object",
                            "properties": {
                                "pitch_tone": {"type": "integer", "minimum": 1, "maximum": 10},
                                "volume": {"type": "integer", "minimum": 1, "maximum": 10},
                                "tempo_pace": {"type": "integer", "minimum": 1, "maximum": 10},
                                "clarity_articulation": {"type": "integer", "minimum": 1, "maximum": 10},
                                "pausing_hesitation": {"type": "integer", "minimum": 1, "maximum": 10},
                                "prosody": {"type": "integer", "minimum": 1, "maximum": 10}
                            }
                        },
                        "word_choice": {
                            "type": "object",
                            "properties": {
                                "formality": {"type": "integer", "minimum": 1, "maximum": 10},
                                "complexity": {"type": "integer", "minimum": 1, "maximum": 10},
                                "repetition": {"type": "integer", "minimum": 1, "maximum": 10},
                                "directness": {"type": "integer", "minimum": 1, "maximum": 10},
                                "emotional_tone": {"type": "integer", "minimum": 1, "maximum": 10}
                            }
                        },
                        "sentence_structure": {
                            "type": "object",
                            "properties": {
                                "sentence_length": {"type": "integer", "minimum": 1, "maximum": 10},
                                "narrative_style": {"type": "integer", "minimum": 1, "maximum": 10},
                                "use_of_questions": {"type": "integer", "minimum": 1, "maximum": 10},
                                "metaphors_analogies": {"type": "integer", "minimum": 1, "maximum": 10}
                            }
                        },
                        "conversational_style": {
                            "type": "object",
                            "properties": {
                                "turn_taking": {"type": "integer", "minimum": 1, "maximum": 10},
                                "responsiveness": {"type": "integer", "minimum": 1, "maximum": 10},
                                "politeness": {"type": "integer", "minimum": 1, "maximum": 10},
                                "assertiveness": {"type": "integer", "minimum": 1, "maximum": 10},
                                "humor_playfulness": {"type": "integer", "minimum": 1, "maximum": 10}
                            }
                        },
                        "nonverbal": {
                            "type": "object",
                            "properties": {
                                "laughter": {"type": "integer", "minimum": 1, "maximum": 10},
                                "gestures": {"type": "integer", "minimum": 1, "maximum": 10},
                                "facial_expressions": {"type": "integer", "minimum": 1, "maximum": 10}
                            }
                        },
                        "overall_impression": {
                            "type": "object",
                            "properties": {
                                "warmth": {"type": "integer", "minimum": 1, "maximum": 10},
                                "authority": {"type": "integer", "minimum": 1, "maximum": 10},
                                "charisma": {"type": "integer", "minimum": 1, "maximum": 10},
                                "overall_score": {"type": "integer", "minimum": 1, "maximum": 10}
                            }
                        }
                    }
                },
                "disfluencies": {
                    "type": "object",
                    "properties": {
                        "filler_words": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "token": {"type": "string"},
                                    "count": {"type": "integer"}
                                }
                            }
                        },
                        "repeated_phrases": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "phrase": {"type": "string"},
                                    "count": {"type": "integer"}
                                }
                            }
                        }
                    }
                },
                "summary": {
                    "type": "string"
                }
            }
        }
    }
}
print("🤖 Sending request to Gemini...")
resp = requests.post(generate_url, json=payload)

if resp.status_code != 200:
    raise RuntimeError(f"❌ Gemini request failed: {resp.text}")

data = resp.json()
print("✅ Gemini response:")

# Print just the text parts
try:
    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            if "text" in part:
                print(part["text"])
except Exception:
    print(data)
