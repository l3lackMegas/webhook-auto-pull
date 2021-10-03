# Webhook Auto-Pull
 The webhook script for make automaic pulling of your repo, And you can custom your script after pulled by edit `configs.json`.

# Installation
Clone this repo.
```bash
git clone https://github.com/l3lackMegas/webhook-auto-pull.git
cd webhook-auto-pull
npm install
```

# Getting Started

First, setup config by copy `sample-configs.json` to `configs.json`.

```bash
cp sample-configs.json configs.json
```
Edit file `configs.json`.
```js

{
    "key": "123456789", // To verify request
    "port": 4545, // Port for run web server
    "repo": {

        "item-name": { // To select repo from configs
            "url": "github.com/User/repo.git", //
            "path": "/local/path/to/repo",
            "branch": "main",
            "user": "git-username",
            "token": "token-or-account-password",
            "script": "" // Custom script, Run after finish pulling
        },

        "item-name-2": {
            "url": "github.com/User/repo2.git",
            "path": "/local/path/to/repo2",
            "branch": "main",
            "user": "username",
            "token": "token-or-account-password",
            "script": "ls -al"
        }

    }
}
```
# Run Server & Usage
Just start script by `node main.js` or using npm script.
```bash
npm run start
```
Add webhook and use payload URL like this.
```
https://www.domain.com/?key=YOUR_KEY_FROM_CONFIG&item=ITEM_NAME_FROM_CONFIG
```
Make sure that your webhook has option similar this image.
![Webhook Add](https://github.com/l3lackMegas/webhook-auto-pull/raw/main/docs/add-webhook.jpg)
