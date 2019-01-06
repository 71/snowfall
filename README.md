Paperplane
==========

Paperplane is an open-source [Workflowy](https://workflowy.com) clone that aims to
be customisable, and to work everywhere. It is highly inspired by
[Vimflowy](https://github.com/WuTheFWasThat/vimflowy), but it does support mobile devices.


## Features
- Offline support.
- Markdown support.
- Designed for both desktop, and mobile.
- Notes and their metadata are stored in human-editable YAML.
- Built-in YAML editor on the web.
- Note searching, with optional caching and fuzzy-finding.


## Roadmap
- Add custom themes.
- Add custom keybindings.
- Add Vim keybindings.
- Create an optional backend that can take care of calling webhooks and storing data.
- Add undo / redo.


## Format

#### `index.yaml`

```yaml
notes:
- text: Notes are stored in `.yaml` files.
- text: >-
          All they need to be supported by Paperplane
          are the `text` field, and an optional `children` field.
  children:
  - text: Obviously, children can be
    children:
    - text: arbitrarily
      children:
      - text: nested
- When there are no children, there is no need for an object.
- text: If you want, you can even include other files!
- !!include included.yaml
```

#### `included.yaml`

```yaml
text: Included files can also have a `text` field.
children:
- But what we really want are sub notes, right?
```
