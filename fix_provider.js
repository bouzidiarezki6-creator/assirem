const fs = require('fs')

let content = fs.readFileSync('src/context/DataProvider.tsx', 'utf-8')

// Regex to replace `setLocal((prev) => persist({ ...prev, ... }))` with `setLocal((prev) => !prev ? null : persist({ ...prev, ... }))`
// Actually, they can be multi-line.
// It's safer to just change the generic type of setLocal?
// If `setLocal` is `useState<AppData | null>(null)`, React expects `(prev: AppData | null) => AppData | null`.

// Instead of regex, let's just make `setLocal` safe by overriding the setter.
// Wait! If I just override `setLocal` inside `DataProvider.tsx` to handle the `null` internally!
// `const updateLocal = useCallback((updater) => setLocal(prev => !prev ? null : updater(prev)), [])`
// Then I replace `setLocal` with `updateLocal`? But wait, `updater` in `setLocal` is already `(prev) => ...`. The problem is TS compiler complaining about `prev` inside the callbacks passed to `setLocal`.
