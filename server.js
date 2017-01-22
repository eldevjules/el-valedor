'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')
const moment = require('moment')
const contentfulManagement = require('contentful-management')

// use `PORT` env var on Beep Boop - default to 3000 locally
var port = process.env.PORT || 3000

var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
})

// clientManagement = contentfulManagement.createClient({
//    accessToken: '241b3000a73311202420e24eb61114c3ddf2d5a22523be2b1e2b13b09515587c'
// })
// space = "x9fpf0wxefkr";

var HELP_TEXT = `
Mi valedor te ayduará a avisar al resto de tu equipo que no encotrarás en la oficina, aunque 
claro para llegar a eso el necesita saber un poco mas, básicamente:
\`aiuda\` - para ver este mensage.
\`novoyir\` - avisar de una ausencia.
`

//*********************************************

// Reporte de Ausencias con MiValedor

//*********************************************



//*********************************************
// Responde al usuario los comandos disponibles
//*********************************************
slapp.message('aiuda', ['mention', 'direct_message'], (msg) => {
  msg.say(HELP_TEXT)
})

//*********************************************
// Inicio de reporte de una ausencia
//*********************************************
slapp.message('novoyir', ['direct_message'], (msg) => {
  
  var state = { requested: Date.now() }
  msg.say({
    text: '',
    attachments: [{
      text: '',
      title: '',
      image_url: 'http://cdn.memegenerator.es/imagenes/memes/full/18/36/18365537.jpg',
      title_link: 'Kha?',
      color: '#7CD197'
    }]
  })
  .say({
    text: 'Oye y cuantos dias faltarás?',
    attachments: [{
      text: '',
      callback_id: 'aviso_dias',
      actions: [
        {
          name: 'days',
          text: 'Uno :icecream:',
          type: 'button',
          value: 'uno',
          style: 'default'
        },
        {
          name: 'days',
          text: 'Varios :fearful:',
          type: 'button',
          value: 'varios',
          style: 'default'
        },
        {
          name: 'days',
          text: 'Ninguno :sweat_smile:',
          type: 'button',
          value: 'ninguno',
          style: 'default'
        }
      ]
    }]
  })
  .route('hanleDaysRequested', state)
})

//*********************************************
//Aqui ya vamos a saber cuantos días se pretende pedir
//*********************************************
slapp.route('hanleDaysRequested', (msg, state) => {
  
  // if they respond with anything other than a button selection, get them back on track
  if (msg.type !== 'action') {
    msg
      .say('Porfavor dinos cuantos días faltarás!!! :rage:')
      .route('hanleDaysRequested', state)
    return
  }

  let answer = msg.body.actions[0].value
  if (answer == 'ninguno') {
    // the answer was not affirmative
    msg.respond(msg.body.response_url, {
      delete_original: true
    })
    msg.say('OK, muy gracioso. :unamused: #NoMeDespiertesALoTonto  #QueFeoQueSeasAsi')
    // notice we did NOT specify a route because the conversation is over
    return
  }
  // use the state that's been passed through the flow to figure out the
  msg.respond(msg.body.response_url, { delete_original: true })
  //Bifurca la conversación
  if (answer == 'uno') {
    state['days'] = 'uno';
    msg.say('Asi que no vendrás un día a la oficina :thinking_face:')
    .say({
      text: 'pero ¿y vas a trabajar? :muscle:',
      attachments: [{
        text: '',
        callback_id: 'aviso_undia',
        actions: [
          {
            name: 'doyougotowork',
            text: 'Si, obvio :nerd_face:',
            type: 'button',
            value: 'yes_work',
            style: 'default'
          },
          {
            name: 'doyougotowork',
            text: 'No :sweat_smile:',
            type: 'button',
            value: 'no_work',
            style: 'default'
          }
        ]
      }]
    })
    .route('handleOneDayAbsence', state)
  }else{
    state['days'] = 'varios';
    msg.say('Vas a faltar mas de un día :speak_no_evil:')
    .say({
      text: 'pero ¿y vas a trabajar? :muscle:',
      attachments: [{
        text: '',
        callback_id: 'aviso_variosdias',
        actions: [
          {
            name: 'doyougotowork',
            text: 'Si, obvio :nerd_face:',
            type: 'button',
            value: 'yes_work',
            style: 'default'
          },
          {
            name: 'doyougotowork',
            text: 'No :sweat_smile:',
            type: 'button',
            value: 'no_work',
            style: 'default'
          }
        ]
      }]
    })
    .route('handleMultipleDayAbsence', state)
  }

})


//*********************************************
// (1) El usuario aviso de un dia de ausencia
//*********************************************
slapp.route('handleOneDayAbsence', (msg, state) => {

  // Validacion de que selecciona un opcion valida para el caminito
  if (msg.type !== 'action') {
    msg
      .say('Porfavor indica si vas a trabajar :computer:')
      .route('handleOneDayAbsence', state)
    return
  }

  //Toma el valor de respuesta y borra la botonera
  let goToWork = msg.body.actions[0].value
  msg.respond(msg.body.response_url, { delete_original: true })

  if (goToWork == 'yes_work') {
    state['work'] = 'yes';
    msg.say({
      text: '',
      attachments: [{
        text: '',
        title: '',
        image_url: 'https://img.buzzfeed.com/buzzfeed-static/static/2016-06/30/19/campaign_images/buzzfeed-prod-web12/18-situaciones-que-te-haran-decir-uy-asi-que-chis-2-19549-1467327920-4_big.jpg',
        title_link: 'Uy asi que chiste!',
        color: '#7CD197'
      }]
    }) //uy asi que chiste
    .say('No, mentira! que bueno que vas a trabajar :metal:')
    .say({
      text: 'ahora dime, ¿que día vas a reportar?',
      attachments: [{
        text: '',
        callback_id: 'ho',
        actions: [
          {
            name: 'hotoreport',
            text: 'Hoy, sorry! :sob:',
            type: 'button',
            value: 'hoToday',
            style: 'default'
          },
          {
            name: 'hotoreport',
            text: 'Un día de estos :innocent:',
            type: 'button',
            value: 'hoBenefit',
            style: 'default'
          }
        ]
      }]
    })
    .route('handleHomeOffice', state)
  }else{
    state['work'] = 'no';
    msg.say('No vas a trabajar') //oye si nos vas a trabajar permitenos saber porque
    //imprevisto
    //vacaciones
    //capacitacion
  }

})

//*********************************************
// (2) El usuario aviso de mas de un dia de ausencia
//*********************************************
slapp.route('handleMultipleDayAbsence', (msg, state) => {
  msg.say('Vamonos riquis varios dias que no?')
})


//*********************************************
// (1.1) El usuario pidio un Home Office
//*********************************************
slapp.route('handleHomeOffice', (msg, state) => {

  // Validacion de que selecciona un opcion valida para el caminito
  if (msg.type !== 'action') {
    msg
      .say('Porfavor indica para cuando es el HO')
      .route('handleHomeOffice', state)
    return
  }
  //Toma el valor de respuesta y borra la botonera
  let typeHO = msg.body.actions[0].value
  msg.respond(msg.body.response_url, { delete_original: true })

  if (typeHO == 'hoToday') {
    state['ho_type'] = 'today';
    msg.say({
      text: '',
      attachments: [{
        text: '',
        title: '',
        image_url: 'https://d.wattpad.com/story_parts/199994350/images/14234e1781fcdde7.jpg',
        title_link: 'Oye viejo, tranquilo',
        color: '#7CD197'
      }]
    }) //oye tranquilo viejo
    .say('No recomendamos pedir Home Office el mero día. Algún karma se pondrá triste por esto :slightly_frowning_face:')
    .say("Pero vamos, sabemos que no fue a proposito, cuentanos ¿Que paso?")
    .route('handleHomeOfficeToday', state)
  }else{
    state['ho_type'] = 'benefit';
    msg.say('Bien! ¿Que día quieres tomar?') 
    msg.respond(msg.body.response_url, { text:'Usar el formato YYYY-MM-DD' })
    .route('handleHomeOfficeBenefit', state)
  }

})

//*********************************************
// (1.1.1) El usuario pidio un Home Office para el mero día
//*********************************************
slapp.route('handleHomeOfficeToday', (msg, state) => {
  var reason = (msg.body.event && msg.body.event.text) || ''
  // user may not have typed text as their next action, ask again and re-route
  if (!reason) {
    return msg
      .say("Seguimos esperando que nos expliques porque HO para hoy :wink:")
      .route('handleHomeOfficeToday', state)
  }
  // add their reason to state
  state['reason'] = reason;

  msg
    .say('Gracias por avisarnos. Ahora podemos organizarnos y seguir ganando en la vida')
    .say(`Ausencia: \`\`\`${JSON.stringify(state)}\`\`\``)
})

//*********************************************
// (1.1.2) El usuario pidio un Home Office para otro día
//*********************************************
slapp.route('handleHomeOfficeBenefit', (msg, state) => {
  var dateString = (msg.body.event && msg.body.event.text) || ''
  var dateRequested = new Date(dateString);

  // user may not have typed text as their next action, ask again and re-route
  if (!dateString || !moment(dateString, 'YYYY-MM-DD').isValid()) {
    return msg
      .say("Al parecer no escribiste un formato de fecha válido, pero a cualquier nos pasa")
      .say("Ahora solo procura ingresarlo en el formato de YYYY-MM-DD")
      .route('handleHomeOfficeBenefit', state)
  }
  // add their reason to state
  state['requestedDate'] = dateRequested;

  msg.say("orale va saludos esau")
  msg.say(`Msg: \`\`\`${JSON.stringify(msg.body)}\`\`\``)

  let userIdentifier = '1FBTMIA3e4A0CAUwOKcSoY';
  let absenceType = 'HO';
  let absences = {
    // Home Office Imprevisto
    HOIm: '5owv8SrNQcqgKOoQ6GyoIM',
    // Recuperaciòn Mèdica
    RM: '6Td4Rc39ksacyqgIw4kQEe',
    //Maternidad/Paternidad
    MP:'3X9eHPRCDCQ4MoOw8QS4UM',
    //Home Office
    HO: '2E9OOlbePeIkaOqsuuU6kE',
    //Imprevisto Parcial
    IMP: '3MwlcPWUWAyUW68o2eWWeI',
    //Vacaciones
    VACA: '6g9R3v0lgsUwESKquaki8O',
    //Capacitación
    CAP: '3C7F7sKPaUUmow2K4Uem0C',
    //Imprevisto
    IMP: '6xk43bzavu0E28qYe2YA08'
  };

  let now = new Date();
  let reported_date = now.getfullYear()+'-'+now.getMonth()+'-'+now.getDate();
  let idate = dateRequested.getfullYear()+'-'+dateRequested.getMonth()+'-'+dateRequested.getDate();
  let fdate = dateRequested.getfullYear()+'-'+dateRequested.getMonth()+'-'+dateRequested.getDate() + 1;

  data = {
    fields : {
      identifier: {'es-MX': absenceType},
      user: {'es-MX': {sys: {type: "Link", linkType: "Entry", id: userIdentifier}}},
      who_approves: {'es-MX': {sys: {type: "Link", linkType: "Entry", id: userIdentifier}}},
      type: {'es-MX': {sys: {type: "Link", linkType: "Entry", id: absences[absenceType] }}},
      group: {'es-MX': 'Prestación'},
      reported_date: {'es-MX': reported_date},
      full_day: {'es-MX': true},
      start_time: {'es-MX': idate},
      end_time: {'es-MX': fdate},
      modification_date: {'es-MX': idate},
      expiration_date: {'es-MX': fdate},
      status: {'es-MX': 'Aprovada'},
      detail: {'es-MX': 'I hate my coworkers'},
      concept: {'es-MX': 'Concepto'}
    }
  }

  //Insertar en Contenful
   contentfulManagement.getSpace(space)
   .then((space) => {
      console.log('Space');
      return space.createEntry('absence', data)
   })
   .then((entry) => {
      console.log(entry.fields)
      res.send entry
      entry.publish()
   })
   .catch((error) => console.log(error))

  //Crear event en calendar


  msg
    .say('Tu HO ha sido solicitada correctamente para el día '+dateRequested)
    .say(`Ausencia: \`\`\`${JSON.stringify(state)}\`\`\``)

})


// Cacha todas las respuestas que no entienda y te da un poco de sabiduria a cambio
slapp.message('.*', ['direct_message'], (msg) => {
    msg.say([
      'Este ps si esta bien bonito Estados Unidos, su este.. ¿Como se llama ?...Su Catedral!',
      'No te preocupes jefa, con que me laves, me planches, me des de comer y me prendas el boiler en la mañana... de lo demás yo me las arreglo solo', 
      'CARNAL! CARNAVALITOOO!! Te estrañé',
      'Es un clasico de los Ayeres! NETA que me sale mejor que all JOSE JOEL!!',
      'Q SABROSOS SON LOS ELOTES CON MAYONESA Y DEL CHILE QUE PICA POCO',
      'Parece mentira que esten tocando esos temas delante de mi carnalito, que todavía tiene sus piecesitos planos. Deberia de darles vergüenza.',
      'IRALA! FIJATE! YA ME ECHASTES JABON EN EL OJO!',
      'Aprobechando que tienes tus manos mojadas ¿No podrías lavar tambien estos tenis del Chino? esque pobrecito tiene que estudiar.',
      'Yo no soy tan efusivo, más sin embargo, una estraña fuerza me indujo a proponerle lo que viene siendo un beso.',
      'AMIGA ¿TE LAVO TU CABELLO?',
      'Siento como que esta bonita amistad que comenzó a germinar, el día de hoy ya está dando sus frutos',
      'No entiendo tu indiferiencia para conmigo',
      'Amaá, el Chino va pa mi cuarto a romperme lo que más me gusta "¡MI POSTER DEL AMÉRICA!"',
      'JIJO... MANO.. QUIEN FUERA KALIMAN!!!',
      'Es de humanos equivocarse, más sin en cambio, es sublime perdonar.',
      'CHINO.! nunca me imagine que en tu corazon cupiera tanta burla...',
      'A Caray! Hijoles, que pena. Esque se me había olvidado que si invite a comer a Maria de todos los ángeles, por lo mismo de que me salvó mi vida.',
      'No creas que no tengo en cuenta todos los bonitos detalles que tienes para conmigo... Nomas ¿Si te molesto con la tele?',
      'No pude dormir nada jefa. Tuve unos sueños bieeen estraños, bien horriblisimos!'
    ])
})
//*********************************************












//*********************************************
// Setup different handlers for messages
//*********************************************



// "Conversation" flow that tracks state - kicks off when user says hi, hello or hey
slapp
  .message('^(hi|hello|hey)$', ['direct_mention', 'direct_message'], (msg, text) => {
    msg
      .say(`${text}, how are you?`)
      // sends next event from user to this route, passing along state
      .route('how-are-you', { greeting: text })
  })
  .route('how-are-you', (msg, state) => {
    var text = (msg.body.event && msg.body.event.text) || ''

    // user may not have typed text as their next action, ask again and re-route
    if (!text) {
      return msg
        .say("Whoops, I'm still waiting to hear how you're doing.")
        .say('How are you?')
        .route('how-are-you', state)
    }

    // add their response to state
    state.status = text

    msg
      .say(`Ok then. What's your favorite color?`)
      .route('color', state)
  })
  .route('color', (msg, state) => {
    var text = (msg.body.event && msg.body.event.text) || ''

    // user may not have typed text as their next action, ask again and re-route
    if (!text) {
      return msg
        .say("I'm eagerly awaiting to hear your favorite color.")
        .route('color', state)
    }

    // add their response to state
    state.color = text

    msg
      .say('Thanks for sharing.')
      .say(`Here's what you've told me so far: \`\`\`${JSON.stringify(state)}\`\`\``)
    // At this point, since we don't route anywhere, the "conversation" is over
  })



// Can use a regex as well
slapp.message(/^(thanks|thank you)/i, ['mention', 'direct_message'], (msg) => {
  // You can provide a list of responses, and a random one will be chosen
  // You can also include slack emoji in your responses
  msg.say([
    "You're welcome :smile:",
    'You bet',
    ':+1: Of course',
    'Anytime :sun_with_face: :full_moon_with_face:'
  ])
})








// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err)
  }

  console.log(`Listening on port ${port}`)
})
