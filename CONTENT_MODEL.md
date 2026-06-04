# Content Model

Pages live in `src/content/pages/<page>/index.mdx`.

Example detail entries live in `src/content/examples/<slug>/index.mdx`.

Images should live beside the MDX file that references them:

```mdx
---
cover: ./cover.jpg
coverAlt: Short useful alt text.
---
```

## How Rendering Works

Frontmatter `sections` choose layout components. The React registry in `src/components/sections/SectionRenderer.tsx` maps each `type` to a component.

The MDX body is for longer editorial prose. It renders below the structured sections.

Use sections when content needs a designed layout. Use the MDX body when the content is mostly article-like copy.

## Available Sections

### `hero`

First-page signal with heading, optional image, and actions.

```yaml
- type: hero
  kicker: Editorial studio
  heading: Atelier Uto
  body: Short opening copy.
  image: ./hero.jpg
  imageAlt: Describe the image.
  actions:
    - label: See examples
      href: /examples/
      variant: primary
```

### `textBlock`

Editorial heading with body copy and optional columns.

```yaml
- type: textBlock
  eyebrow: Approach
  heading: Structured when useful.
  body: Main paragraph.
  columns:
    - First supporting idea.
    - Second supporting idea.
```

### `splitImage`

Copy beside a local image.

```yaml
- type: splitImage
  heading: Image-led section.
  body: Supporting copy.
  image: ./image.jpg
  imageAlt: Describe the image.
  reverse: true
```

### `cards`

Small group of repeated content cards.

```yaml
- type: cards
  heading: Services
  items:
    - title: Content model
      body: Short explanation.
```

### `exampleIndex`

Renders published entries from `src/content/examples`.

```yaml
- type: exampleIndex
  heading: Selected examples
  maxItems: 3
```

### `contactBlock`

Contact-first layout for the contact page.

```yaml
- type: contactBlock
  heading: Start a conversation.
  email: hello@example.com
  links:
    - label: Instagram
      href: https://instagram.com/
```

## Adding A Section Type

1. Add the schema to `src/content.config.ts`.
2. Add the TypeScript type to `src/types/sections.ts`.
3. Add the React component and registry entry in `src/components/sections/SectionRenderer.tsx`.
4. Add an example to this document.

The build should fail if content references a section that is not valid.
