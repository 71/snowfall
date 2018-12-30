Paperplane
==========

Paperplane is an open-source [Workflowy](https://workflowy.com) clone that aims to
be customisable, and to work everywhere. It is highly inspired by [Vimflowy](https://github.com/WuTheFWasThat/vimflowy),
but it does support mobile devices.

- For one, notes are stored in YAML files with as few metadata as possible. Thus,
  no specific editor is needed to interact with Paperplane.
- Also, notes are written in Markdown.


## Server
The server is written in Rust, and is completely optional. It can be used to set
up webhooks or to store notes externally.

## Client
The client is a PWA built with Vue, which means that it can be used offline on
all modern devices.
