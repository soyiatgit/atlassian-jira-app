// const msToTime = (ms) => {
//   let seconds = (ms / 1000).toFixed(1);
//   let minutes = (ms / (1000 * 60)).toFixed(1);
//   let hours = (ms / (1000 * 60 * 60)).toFixed(1);
//   let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
//   if (seconds < 60) return seconds + " Sec";
//   else if (minutes < 60) return minutes + " Min";
//   else if (hours < 24) return hours + " Hrs";
//   else return days + " Days"
// }

function padTo2Digits(num, prefix) {
  num = num.toString().padStart(2, '0');
  return (num === '00') ?  '' : num + ' ' + prefix;
}

function msToTime(milliseconds) {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);

  seconds = seconds % 60;
  minutes = minutes % 60;

  // 👇️ If you don't want to roll hours over, e.g. 24 to 00
  // 👇️ comment (or remove) the line below
  // commenting next line gets you `24:00:00` instead of `00:00:00`
  // or `36:15:31` instead of `12:15:31`, etc.
  hours = hours % 24;
  days = days % 30;

  return `${padTo2Digits(days, 'days')} ${padTo2Digits(hours, 'hrs')} ${padTo2Digits(minutes, 'min')}  ${padTo2Digits(seconds, 'seconds')} `;
}

export default function routes(app, addon) {
    // Redirect root path to /atlassian-connect.json,
    // which will be served by atlassian-connect-express.
    app.get('/', (req, res) => {
        res.redirect('/atlassian-connect.json');
    });

    // This is an example route used by "generalPages" module (see atlassian-connect.json).
    // Verify that the incoming request is authenticated with Atlassian Connect.
    app.get('/hello-world', addon.authenticate(), (req, res) => {
      // console.log('Incoming req ::: ', req.query.xdm_e);
        // Rendering a template is easy; the render method takes two params: the name of the component or template file, and its props.
        // Handlebars and jsx are both supported, but please note that jsx changes require `npm run watch-jsx` in order to be picked up by the server.
        var http = addon.httpClient(req);
          http.get('/rest/api/3/search?fields=summary,status,created,assignee&expand=changelog', (err, resp, body) => {
            const data = JSON.parse(body);
            const assignee = [];
            const statuses = [];
            data.issues.forEach(element => {
              const statusItems = [
                {
                  fromString: 'Todo',
                  toString: 'Todo',
                  created: element.fields.created
                }
              ];
              if(element.fields.assignee) {
                if(assignee.indexOf(element.fields.assignee.displayName) < 0) {
                  assignee.push(element.fields.assignee.displayName);
                }
              }
              if(element.fields.status) {
                if(statuses.indexOf(element.fields.status.name) < 0) {
                  statuses.push(element.fields.status.name);
                }
              }
              element.changelog.histories.forEach((history) => {
                history.items.forEach(historyItem => {
                  if(historyItem.field === 'status') {
                    historyItem.created = history.created;
                    statusItems.push(historyItem);
                  }
                });
              });
              element.statusItems = statusItems.sort((a,b)=> new Date(a.created)-new Date(b.created));
              element.statusItems.forEach((item, i) => {
                if(i < element.statusItems.length - 1) {
                  item.duration = new Date(element.statusItems[i+1].created) - new Date(element.statusItems[i].created);
                  item.duration = msToTime(item.duration);
                } else {
                  item.duration = 'Ongoing';
                }
              });
            });
            res.render(
              'hello-world.hbs', // change this to 'hello-world.jsx' to use the Atlaskit & React version
              {
                title: 'Atlassian Connect',
                data: data,
                assignee: assignee,
                statuses: statuses
                //, issueId: req.query['issueId']
                //, browserOnly: true // you can set this to disable server-side rendering for react views
              }
            );
        });
    });

    // Add additional route handlers here...
}
