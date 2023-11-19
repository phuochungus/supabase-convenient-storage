# supabase-convenient-storage

This package is a wrapper around Supabase storage-js

To use, first create a class

```
let storage: CStorage = new CStorage(supabaseClient);
```

Main function:

### delete recursively (directory and all files inside):
```
storage.delete(["/dir"])
#delete all files inside /dir in the current bucket
```
### List all files in a directory
```
storage.listAllFiles("/dir")
#result will be no first-dash path
```
