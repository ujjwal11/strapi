const jwt = require('jsonwebtoken');
const { authenticate } = require('ldap-authentication')
const axios = require('axios')
const secret =  '78cf38f73ccf176e5c91b881a753733c'
const defaultJwtOptions = { expiresIn: '30d' };

module.exports = {
    // GET /hello
    async index(ctx) {
        const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjA0OTQ4NzQ4LCJleHAiOjE2MDc1NDA3NDh9.576uAH--2-0NE0v7a3gOKe1ZTNA1Bf1sNRl9C_LXDKA'
        // function auth(userDetail) {
            // console.log("userDetail", userDetail)
            let authenticated = await authenticate({
                ldapOpts: { url: 'ldap://ldap.forumsys.com' },
                userDn: 'uid=gauss,dc=example,dc=com',
                userPassword: 'password',
                userSearchBase: 'dc=example,dc=com',
                usernameAttribute: 'uid',
                username: 'gauss',
                groupsSearchBase: 'dc=example,dc=com',
                groupClass: 'group'
            })

            let checkUser = authenticated

                try{
                    const checkThatUserExist = await axios.get(`http://localhost:1337/admin/users?page=1&pageSize=10&_sort=firstname%3AASC&_q=${'Carl'}`, {headers:{'Authorization' : token}})
                    // console.log('checkThatUserExist>>',checkThatUserExist.data.data)
                    var checkUserComp =  checkThatUserExist.data.data.results && checkThatUserExist.data.data.results.length > 0 ? checkThatUserExist.data.data.results : 'no user exist'
                    // res.send(checkUserComp)
                    if(checkUserComp === 'no user exist'){
                        const createNewUser = await axios.post('http://localhost:1337/admin/users', {
                            email : checkUser.mail,
                            firstname : checkUser.cn,
                            lastname : checkUser.sn,
                            roles : [3]
                          }, {
                            headers: {
                              'Authorization': token
                            }
                        })

                        const putBodyData = {
                            "email": createNewUser.data.data.email,
                            "firstname": createNewUser.data.data.firstname,
                            "lastname": createNewUser.data.data.lastname,
                            "isActive": true,
                            "roles": [createNewUser.data.data.roles[0].id]
                        }

                        const activateUser = await axios.put(`http://localhost:1337/admin/users/${createNewUser.data.data.id}`, {...putBodyData},  {headers:{'Authorization' : token}})

                        const data = {
                            "updatedUser": {
                                ...activateUser.data
                            },
                            "updatedToken": {
                                "en": jwt.sign({ id: activateUser.data.data.id }, secret, defaultJwtOptions)
                            }
                        }

                        ctx.send(data);
                    }else{
                        const data = {
                            "updatedUser": {
                                "data":{
                                    ...checkUserComp[0]
                                }
                            },
                            "updatedToken": {
                                "en": jwt.sign({ id: checkUserComp[0].id }, secret, defaultJwtOptions)
                            }
                        }
                        ctx.send(data);
                        // res.send(data)
                    }
                    
                }
                catch(err){
                    console.log('err>>>>', err)
                }
        // }
        // ctx.send(aa);
    },
    // auth()
};