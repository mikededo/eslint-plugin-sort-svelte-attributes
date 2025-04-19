# eslint-plugin-sort-svelte-attributes

> DISCLAIMER
>
> All credits to @azat-io, as this code is a modification from his
> implementation of `eslint-plugin-perfectionist`
>
> Svelte property sorting was discontinued after v4 of `eslint-plugin-import`
> and a solution inside `eslint-plugin-svelte` does not fulfill my needs as
> `eslint-plugin-perfectionist` did
 
## Installation

With your package manager:

```sh
bun add -d eslint-plugin-sort-svelte-attributes

```
In your flat `eslint` config:

```javascript
import sortSvelteAttributes from 'eslint-plugin-sort-svelte-attributes';

export default [
  {
    plugins: { sortSvelteAttributes },
    rules: {
      'sort-svelte-attributes/sort-attributes': [
        'error',
        { type: 'natural', order: 'asc' },
      ],
    },
  },
]
```

In your legacy `eslint` config:

```javascript
module.exports = {
  plugins: [
    'sort-svelte-attributes',
  ],
  rules: {
    'sort-svelte-attributes/sort-attributes': [
      'error',
      { type: 'natural', order: 'asc' }
    ]
  }
}
```

