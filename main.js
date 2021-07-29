'use strict';
const { exec } = require("child_process");
const fs = require('fs');
const debug = require('debug');
const git = require('simple-git');

/* Enable debug */
//debug.enable('simple-git,simple-git:*');
//git().init().then(() => console.log('DONE'));

const bodyParser = require('body-parser');

const CONFIGS_JSON = fs.readFileSync('./configs.json');
const CONFIGS = JSON.parse(CONFIGS_JSON);

const express = require('express')
const app = express()

app.use(bodyParser.urlencoded({ extended: true }));
 
app.post('/', function (req, res) {
    if(req.query.repo && req.query.key == CONFIGS.key) { // Check key from configs.json

        let repoInfo = CONFIGS.repo[req.query.repo],
            payload = JSON.parse(req.body.payload)
        
        if(repoInfo && payload.ref && payload.ref.split('/')[2] == repoInfo.branch) { // Check target repo and branch
            const USER = repoInfo.user;
            const PASS = repoInfo.token;
            const REPO = repoInfo.url;
            const remote = `https://${USER}:${PASS}@${REPO}`; // Remote url

            console.log(`Start pulling [${repoInfo.branch}] with `, remote)
            console.log("To path: ", repoInfo.path)

            git(repoInfo.path).pull(remote, repoInfo.branch).then(() => { // Start pulling

                console.log("Pull Finish.")

                if(repoInfo.script) { // Check if script exist. You can custom script by configs.json

                    console.log("Running script: ", repoInfo.script)

                    exec(repoInfo.script, { // Execute script after pull repo
                        cwd: repoInfo.path
                    }, (error, stdout, stderr) => {
                        if (error) {
                            console.log(`error: ${error.message}`);
                            return;
                        }
                        if (stderr) {
                            console.log(`stderr: ${stderr}`);
                            return;
                        }

                        console.log(`stdout: ${stdout}`);
                    });
                }

                // Response success
                res.json({status: true, message: 'success'})
            })
            .catch((err) => ()=>{
                console.log("Fail.")

                // Response success
                res.json({status: false, message: 'Fail: ' + err})
            })
            return 0
        } else if(payload.ref.split('/')[2] != repoInfo.branch) { // In case doesn't the target branch for pull

            console.log(`Not target branch [${payload.ref.split('/')[2]}].`)

            res.json({status: false, message: 'Not target branch.'})
            return 0
        }
    }

    console.log("Wrong request.")

    res.json({status: false, message: 'Wrong request.'}) // Can't accept this request, because got wrong key
})

app.get('*', (req, res)=>res.send(`Hey, Why are you here? 👀`))
 
app.listen(CONFIGS.port) // You can change port by configs.json
console.log("Running at " + CONFIGS.port)