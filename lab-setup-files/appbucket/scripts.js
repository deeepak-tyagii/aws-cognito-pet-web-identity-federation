function onSignIn(googleToken) {
    credentialExchange(googleToken);
    document.querySelector('.g_id_signin').style.display = 'none';
}

function credentialExchange(googleToken) {
    console.log("Creating decoded token...");
    const googleTokenDecoded = parseJwt(googleToken.credential);
    console.log("ID: " + googleTokenDecoded.sub);
    console.log('Full Name: ' + googleTokenDecoded.name);
    console.log("Email: " + googleTokenDecoded.email);

    if (googleTokenDecoded['sub']) {
        console.log("Exchanging Google Token for AWS credentials...");
        AWS.config.region = 'us-east-1';
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: 'us-east-1:5d91b020-bad1-4691-9826-dc643086fb88',
            Logins: {
                'accounts.google.com': googleToken.credential
            }
        });

        AWS.config.credentials.get(function(err) {
            if (!err) {
                console.log('Exchanged to Cognito Identity Id: ' + AWS.config.credentials.identityId);
                accessImages();
            } else {
                document.getElementById('output').innerHTML = "<b>Authorization failed!</b>";
                console.log('ERROR: ' + err);
            }
        });
    } else {
        console.log('User not logged in!');
    }
}

function accessImages() {
    console.log("Creating Session to S3...");
    var s3 = new AWS.S3();
    var params = {
        Bucket: "petwebidf-patchesprivatebucket-dukni7dqxk2b"
    };

    s3.listObjects(params, function(err, data) {
        if (err) {
            document.getElementById('output').innerHTML = "<b>Access Denied!</b>";
            console.log(err, err.stack);
        } else {
            console.log('AWS response:', data);
            var href = this.request.httpRequest.endpoint.href;
            var bucketUrl = href + data.Name + '/';

            var photos = data.Contents.map(function(photo) {
                var url = s3.getSignedUrl('getObject', {
                    Bucket: data.Name,
                    Key: photo.Key
                });
                return `<a href="${url}" target="_blank"><img src="${url}" alt="Pet Image"></a>`;
            });

            document.getElementById('viewer').innerHTML = photos.join('');
        }
    });
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(window.atob(base64));
}
