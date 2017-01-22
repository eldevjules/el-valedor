'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')

// use `PORT` env var on Beep Boop - default to 3000 locally
var port = process.env.PORT || 3000

var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
})


var HELP_TEXT = `
I will respond to the following messages:
\`aiuda\` - para ver este mensage.
\`novoyir\` - avisar de una ausencia.
\`thanks\` - to demonstrate a simple response.
\`<type-any-other-text>\` - to demonstrate a random emoticon response, some of the time :wink:.
\`attachment\` - to see a Slack attachment message.
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
    text: 'Gracias por avisar ',
    attachments: [{
      text: 'Mi valedor te ayduará a avisar al resto de tu equipo que no encotrarás en la oficina, aunque claro para llegar a eso el necesita saber un poco mas, básicamente',
      title: 'Mi Valedor - Ausencias',
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
      text: `OK, muy gracioso. :unamused: #NoMeDespiertesALoTonto  #QueFeoQueSeasAsi `,
      delete_original: true
    })
    // notice we did NOT specify a route because the conversation is over
    return
  }

  // use the state that's been passed through the flow to figure out the
  var elapsed = (Date.now() - state.requested)/1000
  msg.respond(msg.body.response_url, {
    text: `You requested me to do it ${elapsed} seconds ago`,
    delete_original: true
  })

  // simulate doing some work and send a confirmation.
  setTimeout(() => {
    msg.say('Ok voy a pedirte mas datos')
  }, 3000)

})


// Catch-all for any other responses not handled above
slapp.message('.*', ['direct_message'], (msg) => {
  // respond only 40% of the time
  //if (Math.random() < 0.4) {
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
      'No creas que no tengo en cuenta todos los bonitos detalles que tienes para conmigo... Nomas ¿Si te molesto con la tele?'
    ])
  //}
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




// demonstrate returning an attachment...
slapp.message('attachment', ['mention', 'direct_message'], (msg) => {
  msg.say({
    text: 'Check out this amazing attachment! :confetti_ball: ',
    attachments: [{
      text: 'Slapp is a robust open source library that sits on top of the Slack APIs',
      title: 'Slapp Library - Open Source',
      image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
      title_link: 'https://beepboophq.com/',
      color: '#7CD197'
    }]
  })
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
