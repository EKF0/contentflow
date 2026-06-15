# Workflow Guide — ContentFlow

**Last Updated**: 2026-06-15

---

## Task Workflow

Every task, issue, and sprint follows this cycle:

```
Research → Plan → Organize → Implement → Review → Maintain
```

### 1. Research
- Understand the problem space
- Check competitor approaches
- Review best practices
- Document findings in `Docs/Researchs/`

### 2. Plan
- Break into subtasks
- Estimate effort (story points)
- Identify dependencies
- Create plan in `Docs/Plans/`

### 3. Organize
- Update `roadmap.csv` with issue details
- Assign to sprint
- Set priority and labels
- Update AGENTS.md if needed

### 4. Implement
- Write code following conventions
- Commit often with clear messages
- Follow TypeScript strict mode
- Use existing patterns and components

### 5. Review
- Run lint, typecheck, tests
- Self-review against acceptance criteria
- Check for edge cases
- Verify responsive design

### 6. Maintain
- Update documentation
- Handle edge cases found
- Plan follow-up improvements
- Write report in `Docs/Reports/`

## Documentation Structure

```
Docs/
├── Researchs/          # Market research, competitor analysis, technical research
│   ├── MARKET_RESEARCH.md
│   ├── COMPETITOR_ANALYSIS.md
│   └── COMPONENT_ARCHITECTURE.md
├── Plans/              # Sprint plans, technical architecture, design docs
│   ├── SPRINT_1_PLAN.md
│   ├── DESIGN_SYSTEM.md
│   ├── DATABASE_SCHEMA.md
│   └── API_ARCHITECTURE.md
├── Reports/            # Sprint completion reports, phase summaries
│   └── (populated after each sprint)
└── Notes/              # Guides, crew roster, conventions
    ├── CREW_ROSTER.md
    └── WORKFLOW.md
```

## Commit Convention

Format: `type(scope): description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation
- `test`: Tests
- `chore`: Build/config changes

Examples:
- `feat(grid): add inline cell editing`
- `fix(kanban): prevent drag to same column`
- `docs: update AGENTS.md with Sprint 1 learnings`

## Code Review Checklist

- [ ] TypeScript compiles with zero errors
- [ ] ESLint passes with zero errors
- [ ] No `any` types used
- [ ] Components are properly typed
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard accessible
- [ ] Dark mode works
- [ ] Tests pass (if applicable)
