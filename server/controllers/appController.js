import UserModel from '../model/User.model.js'
import bcrypt from 'bcrypt';
import  jwt  from 'jsonwebtoken';
import ENV from '../config.js';
import otpGenerator from 'otp-generator'


/**middleware for verify user */
export async function verifyUser(req, res, next) {
    try {
        const { username } = req.method == 'GET' ? req.query : req.body;

        //check the user existance
        let exist = await UserModel.findOne({ username });
        if(!exist) return res.status(404).send({error: "Can't find the user!"});
        next();

        
    } catch (error) {
        return res.status(404).send({error: 'Authentication error'})
    }
}

/** POST: http://localhost:8080/api/register 
 * @param : {
  "username" : "example123",
  "password" : "admin123",
  "email": "example@gmail.com",
  "firstName" : "bill",
  "lastName": "william",
  "mobile": 8009860560,
  "address" : "Apt. 556, Kulas Light, Gwenborough",
  "profile": ""
}
*/

export async function register(req, res){

    try {
        const { username, password, profile, email} = req.body;


        //check the existing user
        const existUsername = new Promise((resolve, reject) => {
            UserModel.findOne({ username }).then((err, user) => {
                if(err) reject(new Error(err))
                if(user) reject({error: 'Please use unique username'});

                resolve();
            }).catch(err => reject({ error: 'exist username fineOne error'}));
        });

        //check for rxisting email
        const existEmail = new Promise((resolve, reject) => {
            UserModel.findOne({ email }).then((err, email) => {
                if(err) reject(new Error(err))
                if(email) reject({error: 'Please use unique email'});

                resolve();
            }).catch(err => reject({ error: 'exist email fineOne error'}));
        });



        Promise.all([existUsername, existEmail])
            .then(() => {
                if(password){
                    bcrypt.hash(password, 10)
                        .then( hashedPassword => {
                            
                            const user = new UserModel({
                                username,
                                password: hashedPassword,
                                profile: profile || '',
                                email
                            });

                            // return save result as a response
                            user.save()
                                .then(result => res.status(201).send({ msg: "User Register Successfully"}))
                                .catch(error => res.status(500).send({error}))

                        }).catch(error => {
                            return res.status(500).send({
                                error : "Enable to hashed password"
                            })
                        })
                }
            }).catch(error => {
                return res.status(500).send({ error })
            })


    } catch (error) {
        return res.status(500).send(error)
    }

}

/** POST: http://localhost:8080/api/login 
 * @param: {
  "username" : "example123",
  "password" : "admin123"
}
*/

export async function login(req, res) {
   const { username, password } = req.body;

   try {
      UserModel.findOne({ username })
      .then(user => {
        bcrypt.compare(password, user.password)
        .then(passwordCheck => {
            if(!passwordCheck) return res.status(400).send({error: "Don't have password"});

            //create jwt 
            const token = jwt.sign({
                userId: user._id,
                username: user.username,
            }, ENV.JWT_SECRET, { expiresIn: '24h'});

            return res.status(200).send({
                msg: 'Login Successful...!',
                username: user.username,
                token
            });
        })
        .catch(error => {
            return res.status(400).send({ error: 'Password does not match'})
        })
      })
      .catch( error => {
        return res.status(404).send({ error: 'Username not found'})
      })
    
   } catch (error) {
    return res.status(500).send({ error });
    
   }
}



/** GET: http://localhost:8080/api/user/example123 */
export async function getUser(req, res) {
    const { username } = req.params;

    try {
        // if(!username) return res.status(500).send({ error: 'Invalid username'});

        // UserModel.findOne({ username }, function(err, user) {
        //     if(err) return res.status(500).send({ err });
        //     if(!user) return res.status(501).send({ error: "couldn't find the user" });

        //     return res.status(201).send(user);
        // })
        if (!username) return res.status(501).send({ error: "Invalid Username" });

        const user = await UserModel.findOne({ username},  { password: 0 } );

        if (!user) {
            return res.status(501).send({ error: "Couldn't Find the User" });
        }

        

        return res.status(201).send(user);
        
    } catch (error) {
        return res.status(404).send({ error: 'Cannot find the user data'})
    }
}



/** PUT: http://localhost:8080/api/updateuser 
 * @param: {
  "header" : "<token>"
}
body: {
    firstName: '',
    address : '',
    profile : ''
}
*/
export async function updateUser(req, res) {
    try {
        // const id = req.query.id;
        const { userId } = req.user;
        if (userId) {
            const body = req.body;

            // Log relevant information
            //console.log("Updating user with ID:", userId);
            //console.log("Update data:", body);

            const result = await UserModel.updateOne({ _id: userId }, body);

            //console.log("Update result:", result);

            if (result.modifiedCount > 0) {
                // Fetch and log the updated user data
               // const updatedUser = await UserModel.findOne({ _id: userId });
                //console.log("Updated user data:", updatedUser);

                return res.status(201).send({ msg: "Record Updated...!" });
            } else {
                return res.status(404).send({ error: "User not found or no changes made." });
            }
        } else {
            return res.status(401).send({ error: "User not found....!" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
}


/** GET: http://localhost:8080/api/generateOTP */
export async function generateOTP(req, res) {
    req.app.locals.OTP = await otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })
    res.status(201).send({ code: req.app.locals.OTP})
}


/** GET: http://localhost:8080/api/verifyOTP */
export async function verifyOTP(req, res) {
    const { code} = req.query;
    if(parseInt(req.app.locals.OTP) === parseInt(code)) {
        req.app.locals.OTP = null,  //reset the otp value
        req.app.locals.resetSession = true;  //start session for reset password
        return res.status(201).send({ msg: 'Verify successfully'})
    }
    return res.status(400).send({ error: 'Invalid OTP'})
}

// successfully redirect user when OTP is valid
/** GET: http://localhost:8080/api/createResetSession */
export async function createResetSession(req, res) {
    if(req.app.locals.resetSession){
        // req.app.locals.resetSession = false;  //allow access to this route only once
        return res.status(201).send({ flag: req.app.locals.resetSession});
    }

    return res.status(440).send({ error: 'session expired!'});
}




// update the password when we have valid session
/** PUT: http://localhost:8080/api/resetPassword */
 export async function resetPassword(req, res) {


   try {
    
    if(!req.app.locals.resetSession) return res.status(440).send({ error: 'Session expired' });

      const { username, password } = req.body;

      try {
        const user = await UserModel.findOne({ username });
    
        if (!user) {
            return res.status(404).send({ error: 'Username not found' });
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
    
        const updateResult = await UserModel.updateOne(
            { username: user.username },
            { password: hashedPassword }
        );
        req.app.locals.resetSession = false; 
    
        return res.status(201).send({ msg: 'Record Updated' });
    } catch (error) {
        return res.status(500).send({ error: error.message || 'Internal Server Error' });
    }
    
   } catch (error) {
    return res.status(401).send({error});
   }
}

