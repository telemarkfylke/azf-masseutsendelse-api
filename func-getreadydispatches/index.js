const Dispatches = require('../sharedcode/models/dispatches.js')
const getDb = require('../sharedcode/connections/masseutsendelseDB.js')
const HTTPError = require('../sharedcode/vtfk-errors/httperror');
const blobClient = require('@vtfk/azure-blob-client');
const axios = require('axios');

let arr = []
let ownersArray = []
let requestDataArr = []

let postAdresse = {
    adresse: "",
    postNummer: "",
    postSted: "",
}
let ownerSimplified = {
    navn: "",
    _type: "",
    nummer: "",
    postAdresse: "",
}

let requestData = {
    template: "",
    documentDefinitionId: "",
    data: "",
}

let request = {
    url: "",
    method: '',
    data: {
        attachments: "",
    },
}

function pick(obj, ...props) {
    return props.reduce(function(result, prop) {
      result[prop] = obj[prop];
      return result;
    }, {});
}


module.exports = async function (context, req) {
    try {
        // Authentication / Authorization
        if(req.headers.authorization) await require('../sharedcode/auth/azuread').validate(req.headers.authorization);
        else if(req.headers['x-api-key']) require('../sharedcode/auth/apikey')(req.headers['x-api-key']);
        else throw new HTTPError(401, 'No authentication token provided');

        // Await the DB connection 
        await getDb()
        context.log("Mongoose is connected")

        // Find all disptaches 
        let dispatch = await Dispatches.find({'status': 'approved'})
        if(!dispatch) { throw new HTTPError(404, 'No dispatches with the status approved/godkjent found in the database.') }

        // Download attachments from blob
        for(let i = 0; i < dispatch.length; i++) {
            if(dispatch[i].attachments && Array.isArray(dispatch[i].attachments) && dispatch[i].attachments.length > 0){
                for (let j = 0; j < dispatch[i].attachments.length; j++){
                    const file = await blobClient.get(`${dispatch[i]._id}/${dispatch[i].attachments[j].name}`)
                    if(!file) {throw new HTTPError(404, 'No files found, check if you passed the right filename and/or the right dispatchId')}
                }
            }
        }

        // Generate pdf
        for(let i = 0; i < dispatch.length; i++) {
            requestData = {}
            request = {}
            
            // Get the template data from the dispatch object and assign it to the requestData object.
            if(dispatch[i].template.template === undefined) {
                console.log(`No template found for dispatch object with id ${dispatch[i]._id}`)
            } else {
                requestData.template = dispatch[i].template.template
                requestData.documentDefinitionId = dispatch[i].template.documentDefinitionId
                requestData.data = dispatch[i].template.data
                if(dispatch[i].attachments && Array.isArray(dispatch[i].attachments) && dispatch[i].attachments.length > 0) {
                    requestData.data.attachments = dispatch[i].attachments
                }
                // Push the requestData object to the requestDataArr
                requestDataArr.push(requestData)
            }
            
            // Define the request 
            request.url = process.env.PDF_GENERATEV2
            request.method = 'post'
            request.data = requestDataArr[i]

            console.log(requestDataArr[i])
            
            // Make the request to the pdf endpoint
            try {
                if(dispatch[i].template.template != null) {
                    const response =  await axios.request(request)
                    // Save the generated pdf file to the blob on the correct dispatch id. 
                    await blobClient.save(`${dispatch[i]._id}/AutoGeneratedPDF`, response.data.base64);
                } else {
                    console.log(`No template found for dispatch object with id ${dispatch[i]._id}`)
                }
               
            } catch (err) {
                context.log(err)
                context.res.status(400).send(JSON.stringify(err, Object.getOwnPropertyNames(err)))
                throw err
            }
        }
    
        // Assign the system, projectId and tasks to the dispatch Object.
        for(let i = 0; i < dispatch.length; i++) {
            systemsObj = {
                projectId: 30,
                system: 'Masseutsendelse',
                tasks: [{ system: 'p360', method: 'updateperson' }, { system:'svarut', method: 'send' }]
                
            }
            Object.assign(dispatch[i], systemsObj)
        }

        // Isolate the owners for datastripping
        for(let i = 0; i < dispatch.length; i++) {
            arr.push(pick(dispatch[i], 'owners'))
        }

        // Simplify the owners array, by removing the data that is obsolete. 
        let owners = arr.map(x => x.owners)
        for(let i = 0; i < owners.length; i++) {
            for(let j = 0; j < owners[i].length; j++) {
                // Private owners
                if (owners[i][j]._type === "FysiskPerson") {
                    if (owners[i][j].dsf === undefined || owners[i][j].dsf.NAVN === undefined) {
                        console.log(` ${owners[i][j].navn } was skipped. No brreg information on the company/person`)
                    } else {
                        postAdresse = {}
                        ownerSimplified = {}
                        Object.assign(ownerSimplified, { navn: owners[i][j].dsf.NAVN } )
                        Object.assign(ownerSimplified, { _type: owners[i][j]._type } )
                        Object.assign(ownerSimplified, { nummer: owners[i][j].dsf.INR } )

                        Object.assign(postAdresse, { adresse: owners[i][j].dsf.ADR } )
                        Object.assign(postAdresse, { postNummer: owners[i][j].dsf.POSTN } )
                        Object.assign(postAdresse, { postSted: owners[i][j].dsf.POSTS } )

                        Object.assign(ownerSimplified, { postAdresse: postAdresse } )
                    }
                }
                // Business owners
                else if (owners[i][j]._type === "JuridiskPerson") {
                    postAdresse = {}
                    ownerSimplified = {}
                    if (owners[i][j].brreg === undefined || owners[i][j].brreg.forretningsadresse === undefined ) {
                        Object.assign(ownerSimplified, { navn: owners[i][j].navn } )
                        Object.assign(ownerSimplified, { _type: owners[i][j]._type } )
                        Object.assign(ownerSimplified, { nummer: owners[i][j].nummer } )

                        Object.assign(postAdresse, { adresse: "" } )
                        Object.assign(postAdresse, { postNummer: "" } )
                        Object.assign(postAdresse, { postSted: "" } )
                        console.log(` ${owners[i][j].navn } was skipped. No brreg information on the company/person`)
                    } else {
                        Object.assign(ownerSimplified, { navn: owners[i][j].navn } )
                        Object.assign(ownerSimplified, { _type: owners[i][j]._type } )
                        Object.assign(ownerSimplified, { nummer: owners[i][j].nummer } )

                        Object.assign(postAdresse, { adresse: owners[i][j].brreg.forretningsadresse.adresse } )
                        Object.assign(postAdresse, { postNummer: owners[i][j].brreg.forretningsadresse.postnummer } )
                        Object.assign(postAdresse, { postSted: owners[i][j].brreg.forretningsadresse.poststed } )

                        Object.assign(ownerSimplified, { postAdresse: postAdresse } )   
                    }
                }
                // Push the ownerSimplified object (that includes the adress of the owner) to the ownersArray.
                ownersArray.push(ownerSimplified)
                // Assing the ownersArray to the correct dispatch object.
                Object.assign(dispatch[i], {owners: ownersArray})
            }
            // Clear the ownersArray to remove old owners from the array. 
            ownersArray = []
        }
        // Clear the array: arr of owners from the simplifying 
        arr = []

        // Push the dispatch object with the selected props. 
        for(let i = 0; i < dispatch.length; i++) {
            arr.push(pick(dispatch[i], '_id', 'system', 'projectId', 'tasks', 'archivenumber', 'attachments', 'template', 'owners'))
        }
      
        context.res.send(arr)
        ownersArray = []
        arr = []
    } catch (err) {
        context.log(err)
        context.res.status(400).send(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        throw err
    }
}


