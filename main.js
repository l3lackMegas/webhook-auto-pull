'use strict';
const { exec } = require("child_process");
const fs = require('fs');
const debug = require('debug');
const git = require('simple-git');

/* Enable debug */
//debug.enable('simple-git,simple-git:*');
//git().init().then(() => console.log('DONE'));

const CONFIGS_JSON = fs.readFileSync('./configs.json');
const CONFIGS = JSON.parse(CONFIGS_JSON);

const express = require('express')
const app = express()

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb' }));
 
app.post('/', async function (req, res) {
    let item_namespace = req.query.repo || req.query.item
    if(item_namespace && req.query.key == CONFIGS.key) { // Check key from configs.json

        let repoInfo = CONFIGS.repo[item_namespace],
            payload = JSON.parse(req.body.payload)

        if(!payload.ref && !payload.zen) { // Check payload
            console.log(`[${item_namespace}] Can't find refernce.`)
            res.json({
                status: false,
                message: `Can't find refernce.`,
                diagnosis: `Auto pull can't find target repo from webhook's payload. Please check the webhook payload and open issue to https://github.com/l3lackMegas/webhook-auto-pull/issues`
            })
            return 0
        } else if(!payload.ref && payload.zen) { // Check payload
            console.log(`[${item_namespace}] Init autopull.`)
            res.json({
                status: false,
                message: `[Ignore] This is a request from webhook's test. (${payload.zen})`,
                diagnosis: `Let do commit to your target branch!`
            })
            return 0
        }

        if(!repoInfo) {
            console.log(`[${item_namespace}] Can not found this item from configs. [${item_namespace}]`)
            
            res.status(500) 
            res.json({
                status: false,
                message: `Can not found this item from configs. [${item_namespace}]`,
                diagnosis: `Please check config's namespace that look like &repo=item_namespace from your url.`
            })
            return 0
        }

        if(repoInfo && payload.ref.split('/')[2] == repoInfo.branch) { // Check target repo and branch
            const USER = repoInfo.user;
            const PASS = repoInfo.token;
            const REPO = repoInfo.url;
            const remote = `https://${USER}:${PASS}@${REPO}`; // Remote url

            console.log(`[${item_namespace}] Start pulling (${repoInfo.branch}) with `, remote)
            console.log(`[${item_namespace}] To path: `, repoInfo.path)

            try {
                await git().init();
                await git().fetch(remote, repoInfo.branch, (status)=>{
                    res.status(200)
                    res.json({status: true, message: 'success'})
                })
            }
            catch (err) { 
                /* handle all errors here */
                console.log(`[${item_namespace}] Fail.` + err)

                // Response success
                res.status(500)
                res.json({
                    status: false,
                    message: 'Fail: ' + err,
                    diagnosis: `This is error from server. Please contact server owner or open issue to https://github.com/l3lackMegas/webhook-auto-pull/issues`
                })
                return 0
            }
            // Response success
            git(repoInfo.path).pull(remote, repoInfo.branch).then((status) => { // Start pulling
                
                console.log(`[${item_namespace}] Pull Finish.`)

                if(repoInfo.script) { // Check if script exist. You can custom script by configs.json

                    console.log(`[${item_namespace}] Running script: `, repoInfo.script)

                    exec(repoInfo.script, { // Execute script after pull repo
                        cwd: repoInfo.path
                    }, (error, stdout, stderr) => {
                        if (error) {
                            console.log(`[${item_namespace}] error: ${error.message}`);
                            return;
                        }
                        if (stderr) {
                            console.log(`[${item_namespace}] stderr: ${stderr}`);
                            return;
                        }

                        console.log(`[${item_namespace}] stdout: ${stdout}`);
                    });
                }
            })
            .catch((err) => ()=>{
                console.log(`[${item_namespace}] Fail.` + err)

                // Response success
                res.status(500)
                res.json({
                    status: false,
                    message: 'Fail: ' + err,
                    diagnosis: `This error is from simple-git package. Please check error from official repo. (https://github.com/steveukx/git-js)`
                })
            })
            
            
            return 0
        } else if(repoInfo && payload.ref.split('/')[2] != repoInfo.branch) { // In case doesn't the target branch for pull

            console.log(`[${item_namespace}] Not target branch [${payload.ref.split('/')[2]}].`)
            
            res.status(202) 
            res.json({
                status: false,
                message: '[Ignore] Not target branch.',
                diagnosis: `Try to check your branch that you commit is same with configs file.`
            })
            return 0
        }
    }

    console.log(`[${item_namespace}] Wrong request.`)
    res.status(500)
    res.json({
        status: false,
        message: 'Wrong request.',
        diagnosis: `Can't accept this request, because got wrong key. Please check key from config your config`
    }) // Can't accept this request, because got wrong key
})

app.get('*', (req, res)=>res.send(`Hey, Why are you here? 👀`))
 
app.listen(CONFIGS.port) // You can change port by configs.json
console.log("Running at " + CONFIGS.port)