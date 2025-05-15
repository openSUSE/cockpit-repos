# How to make a release

1. Clone the repo.
2. Create a new anotated tag with `git tag -a version` where version is the new tag/version.
3. You will be interactively asked to create a message it should be in the format.
```md
Version

- Update to patternfly 6
- Node Modules updates
- Bug fixes
```
4. Push to the main branch. On push this will start a action which will create a new release with the notes from the tag.