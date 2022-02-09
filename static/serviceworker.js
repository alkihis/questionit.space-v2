// The serviceworker context can respond to 'push' events and trigger
// notifications on the registration property
const SITEURL = 'https://questionit.space';

// New question
function getBodyForNewQuestion(question) {
  const is_french = navigator.language.startsWith('fr');
  let title, body;

  if (is_french) {
    if (question.emitter) {
      title = 'Nouvelle question !';
      body = `De ${question.emitter.name} — ` + question.content;
    }
    else {
      title = 'Nouvelle question anonyme !';
      body = question.content;
    }
  }
  else {
    if (question.emitter) {
      title = 'New question!';
      body = `From ${question.emitter.name} — ` + question.content;
    }
    else {
      title = 'New anonymous question!';
      body = question.content;
    }
  }

  return { title, body, url: SITEURL + '/waiting' };
}

// Question replied
function getBodyForNewReplied(question) {
  const is_french = navigator.language.startsWith('fr');
  let title;
  let body = `${question.content} — ${question.answer}`;

  if (is_french) {
    title = `${question.receiver.name} a répondu à votre question !`;
  }
  else {
    title = `${question.receiver.name} has replied to your question!`;
  }

  return { title, body, url: SITEURL + '/u/' + question.receiver.slug + '/' + question.id };
}

// New follower
function getBodyForNewFollower(user, is_follow_back) {
  const is_french = navigator.language.startsWith('fr');
  let title, body;

  if (is_french) {
    title = `${user.name} vous a suivi${is_follow_back ? ' en retour' : ''} !`;
    body = `${user.name} s'est abonné à vos questions et les recevra dans sa timeline.`;
  }
  else {
    title = `${user.name} has followed you${is_follow_back ? ' back' : ''}!`;
    body = `${user.name} has subscribed to your questions and will receive them inside his timeline.`;
  }

  return { title, body, url: SITEURL + '/u/' + user.slug };
}

// Print the push notification
function showNotification(title, body, url) {
  return self.registration.showNotification(title, { 
    body, 
    icon: '/images/logo/LogoBlack.png', 
    tag: 'question-send-tag', 
    data: {
      url
    },
  });
}

// Send message to alert everyone of the new thing
function sendToEveryone(payload) {
  self.clients.matchAll({
    includeUncontrolled: true,
    type: 'window',
  }).then(clients => {
    clients.forEach(client => client.postMessage(payload));
  });
}

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

self.addEventListener('push', event => {
  const data = JSON.parse(event.data.text());
  let question, type, payload, client_payload;

  if (data.new_question) {
    question = data.new_question;
    type = 'question-worker';
    payload = getBodyForNewQuestion(question);
    client_payload = { question, type, id: String(data.id) };
  }
  else if (data.answered_question) {
    question = data.answered_question;
    type = 'answered-worker';
    payload = getBodyForNewReplied(question);
    client_payload = { question, type, id: String(data.id) };
  }
  else if (data.new_follower) {
    client_payload = { 
      user: data.new_follower, 
      type: 'follow-worker', 
      follow_back: data.follow_back || false,
      id: String(data.id),
    };

    payload = getBodyForNewFollower(client_payload.user, client_payload.follow_back);
  }
  else {
    // Unsupported notification type
    return;
  }

  event.waitUntil(showNotification(payload.title, payload.body, payload.url));

  // Send question to client
  sendToEveryone(client_payload);
});
