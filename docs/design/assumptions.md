# Assumptions

This page tracks what the workshop design assumes. Entries that also appear in the handbook's [Open assumptions and risks](../maintainer-handbook.md#open-assumptions-and-risks) are only linked from here.

## Workshop

| Assumption | Status | How to check |
| --- | --- | --- |
| Design Thinking plus RPI fits in 2 hours with scripted prompts | Open, see the handbook | Time a full dry run |
| Scripted prompts give similar enough outputs for group debriefs | Open, see the handbook | Compare outputs from the dry run |
| Licences cover Copilot CLI, Copilot cloud agent and agentic workflows | Open, see the handbook | Ask on the [kick-off call](../kick-off-call-checklist.md) |
| The organization allows plugin marketplaces, APM sources and the required hosts | Open, see the handbook | Ask on the kick-off call and run the [prerequisites](../prerequisites.md) |
| Attendees can review RPI output without prior HVE-Core experience | To validate | Watch the review gates during the dry run |
| A synthetic track dataset is acceptable | Confirmed | `src/api/Data/tracks.json` is synthetic |
| Cost and model selection stay a short decision guide without prices, and HydraFusion stays optional | Confirmed | See the handbook's scope limits |
| The React front end renders enough for an accessibility review to find issues | To validate | Run the accessibility workflow on the finished feature |

## Workshop tester

The workshop tester replays the Afternoon 2 lab in a Codespace on a throwaway sandbox repository.

| Assumption | Status | How to check |
| --- | --- | --- |
| The sandbox repository and Codespace are deleted after every run, on success and on failure | To validate | Check the account after a passing and a failing run |
| A passing run creates no issue, only a workflow summary | To validate | Read the run summary of a passing run |
| Copilot cloud agent and agentic workflows are enabled for repositories created by the sandbox owner | To validate | Run the tester once end to end |
| Interactive steps are checked on outcomes (files, tests), not on exact text | Confirmed | See `tests/workshop/afternoon-2/run-lab.sh` |
