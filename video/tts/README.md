# Optional legacy voiceover generator

This tool belongs to the earlier 82-second storyboard. The current 160-second film uses music only and does not import this generator or its audio. Its script and dependency lockfile are retained separately for reproducibility; its timings and narration do not describe the current film.

To reproduce the old audition clips, run `npm ci` and `npm run generate` from this directory. The generator downloads Kokoro-82M into `.cache/` and writes audio plus a manifest to `../public/vo/`. Both downloaded model files and generated auditions remain ignored by Git. No regeneration is needed to render the current film.
