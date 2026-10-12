# Judge guide

- [Live judge evidence](https://bot-company.onrender.com/judges/)
- [Specialist execution and usage](https://bot-company.onrender.com/judges/#execution)
- [CFO workflow comparison](https://bot-company.onrender.com/judges/#cfo)
- [Neat Bot tracking and monitoring](https://bot-company.onrender.com/judges/#neatbot)
- [Build in public timeline](https://bot-company.onrender.com/judges/#public)
- [Capture index](https://bot-company.onrender.com/evidence/2026-10-12/README.md)
- [Launch video](https://bot-company.onrender.com/#video)

## CFO: company files → connected, approved action

Two separate frames. **Without cfo.ai** (captures 27, 43–47): CFO Bot before connecting, then a fresh run that builds the plan from company files, saves a local Markdown file and says live cfo.ai is not connected. Its answer calls $60,480 of annual gross profit about 2.4 months of burn; at roughly $300k monthly burn that is about 0.2 months. **With cfo.ai MCP** (captures 28–29, 36–38): OAuth consent, the connected toast, named MCP tools, approval before the text write, and page #140 open in cfo.ai. These are separate runs with different prompts.

Each CFO frame has its own pill sequence: six disconnected views (connect, prompt, local plan, assumptions, cash flow, calculation issue) and five connected views (consent, connected, MCP tools, approval, saved page). Each view can be shared using its URL (`?cfoMode=without|with&cfoStep=N#cfo`).

## Specialist execution and usage

Captures 48–56 show GitHub assignment checks and Research search refinement, completed answers, per-message caps and app/dashboard usage. GitHub displays $0.012 / ~98k tokens and a 19.5s trace; Research displays $0.0063 / ~36k tokens and a 55.0s trace. These are rounded observations for two different tasks, not a speed/cost comparison or general reliability claim. The two supplied clickable trace IDs are listed together because their individual mapping was not independently verified behind sign-in. See the capture index for originals and limitations.


## Neat Bot: tracking and monitoring

Captures 57–58 show Neat Bot asked to review recent traces and analyse cost per agent: it calls Neatlogs ping and whoami, then returns a per-run table of nine traces and its findings on what drives cost. The figures are Neat Bot's output as displayed.

## Build in public

The four @rk625dev posts from 10–12 October are embedded on the judges page as a timeline, each linking to the original post on X.
