var API_ALARMS     = "http://culprit.mmi-lepuy.fr/index.php/culprit/alarmsJSON/",
    API_RECORDS    = "http://culprit.mmi-lepuy.fr/index.php/culprit/recordsJSON/";

var CURRENT_ALARM  = {},
    STATUS_CODE    = {"0":"Entrée", "1":"Sortie", "2":"Désactivation", "3":"Activation"},
    PULL_DELAY     = 3000,
    INTERNET_DELAY = 5000,
    lastId = 0,
    interval = undefined;

document.addEventListener("offline", onOffline, false);
document.addEventListener("online", onOnline, false);
$(document).ready(function() {
  setTimeout(function() { $('#internet-message').removeClass('hidden'); }, INTERNET_DELAY);
  localStorage.setItem('objects', 3);
  $("body").addClass('home');

  $('#app').load('app/views/home.html', function() {
    $.getJSON(API_RECORDS, function(data) { fillPageWithRecords(data.reverse(), 3); });
    setButtonState();
    if (!interval) {
      interval = window.setInterval(function() {
        $.getJSON(API_RECORDS, function(data) {
          var n = localStorage.getItem('objects');
          fillPageWithRecords(data.reverse(), n);
        });
      }, PULL_DELAY);
    }
  });

  $(document).on('click', 'nav a, .turbolink', router);
  $(document).on('click', '#activ', toggleAlarm);
  $(document).on('click', 'a.delete', deleteRecord);
  $(document).on('click', 'i.delete-all', deleteAllRecords)
  $(document).on('click', 'a.collapser', manageCollapses)
});

function router(e) {
  e.preventDefault();
  $('#navbar-collapse-01').collapse('hide');
  $("body").removeClass('home');

  var targetUrl = $(this).attr('data-url');
  $('#app').load('app/views/' + targetUrl + '.html', function() {

    switch (targetUrl) {
      case 'stats':
        var d = new Date();
        $('#date-now').text(d.getDay() + "/" + d.getMonth() + "/" + d.getFullYear());
        $.getJSON(API_RECORDS, function(data) {
          $('.loader').remove();

          var d = populateInOutRatio(data);
          if (d === 0) {
            $("#chart-area").remove();
            $("#canvas-holder").append('<p class="info">Aucune donnée disponible.');
          } else {
            var ctx = document.getElementById("chart-area").getContext("2d");
            window.myDoughnut = new Chart(ctx).Doughnut(d, {responsive : true, animation: false});
          }

          d = populateInOutNumbers(data);
          var ctx2 = document.getElementById("bar-area").getContext("2d");
          window.myBar = new Chart(ctx2).Bar(d, {responsive : true, animation: false});
          $("#collapseTwo").removeClass("in");
        });

        break;

      case 'home':
        setButtonState();
        localStorage.setItem('objects', 3);
        $("body").addClass('home');
        setTimeout(function() { $('#internet-message').removeClass('hidden'); }, INTERNET_DELAY);
        $.getJSON(API_RECORDS, function(data) {
          fillPageWithRecords(data.reverse(), 3);
        });
        break;

      case 'historique':
        localStorage.setItem('objects', 100);
        setTimeout(function() { $('#internet-message').removeClass('hidden'); }, INTERNET_DELAY);
        $.getJSON(API_RECORDS, function(data) {
          fillPageWithRecords(data.reverse(), 100);
        });
        break;

      default:
        break;
    }
  });
}

function deleteRecord() {
  var id = $(this).attr('id');
  $.getJSON(API_RECORDS + "delete?id=" + id);
  $('#el_' + id).addClass('disappearing').find('.delete').remove();
  $('#el_' + id).find('i.fa').removeClass().addClass('fa fa-cog fa-spin');
}

function deleteAllRecords() {
  if (confirm("Voulez-vous vraiment supprimer tous les enregistrements ?")) {
    var query = "delete_all";
    $.getJSON(API_RECORDS + query, function(data) {
      $.getJSON(API_RECORDS, function(data) {
        fillPageWithRecords(data.reverse(), 100);
      });
    });
  }
}

function manageCollapses() {
  $(this).children('i').toggleClass('fa-chevron-down');
  $(this).children('i').toggleClass('fa-chevron-up');
  var target = $(this).parent().siblings('h4');
  $("html, body").animate({scrollTop: $(target).offset().top}, 600);
}

function setButtonState() {
  var btn = $("#activ");
  var ENABLED = 1,
      DISABLED = 0;

  $.getJSON(API_ALARMS + "last", function(data) {
    CURRENT_ALARM = data;
    var status = data.status;
    $(btn).attr('data-status', status);
    if (status == ENABLED) {
      $(btn).find("span").text("Capteur activé");
      $(btn).css({"background-color": "white", "color": "#2980B9"});
    } else {
      $(btn).find("span").text("Capteur désactivé");
      $(btn).css({"background-color": "transparent", "color": "white"});
    }
    $("#activ i").addClass('hidden');
    $("#activ span").removeClass('hidden');
  });
}

function toggleAlarm() {
  var btn = $("#activ");
  $("#activ i").removeClass('hidden');
  $("#activ span").addClass('hidden');

  var st = $(btn).attr('data-status') == 1 ? 0 : 1;
  var query = "update?id=" + CURRENT_ALARM.id + "&detector=" + CURRENT_ALARM.detector + "&status=" + st;
  var url = API_ALARMS + query;
  $.getJSON(url, function(data) {
    setButtonState();
  });

  var st2 = st + 2;
  var queryRecord = "create?type=" + st2 + "&archive=0";
  var url = API_RECORDS + queryRecord;
  $.getJSON(url, function(data) { /* empty */ });
}

function fillPageWithRecords(records, limite) {
  var currentDay;
  if (records[0]) {
    newId = records[0].id;
    var d = new Date(records[0].timestamp);
    // currentDay = d.getUTCDate() + "/" + d.getUTCMonth();
    t = records[0].type;
    if (lastId != 0 && newId > lastId) {
      lastId = newId;
      if (navigator.vibrate) {
        var type = STATUS_CODE[records[0].type];
        var ts = extractDateComponents(records[0].timestamp);
        var duration;
        switch (t) {
          case '0': case '1':
            duration = 1500;
            break;
          case '2': case '3':
            duration = 500;
            break;
          default:
            duration = 1000;
        }
        navigator.vibrate(duration);
        if (cordova.plugins && cordova.plugins.notification) {
          cordova.plugins.notification.local.schedule({
            title: "Nouvel enregistrement Culprit !",
            message: "" + type + " à " + ts.hour + ":" + ts.minute
          });
        }
      }
    }
    lastId = newId;
  }
  if (records.length < 3) {
    $(".showmore").css('opacity', 0);
    $("footer").css('background', 'transparent');
    $("footer").css('box-shadow', 'none');
  } else {
    $(".showmore").css('opacity', 1);
    $("footer").css('background', 'white');
    $("footer").css('box-shadow', '0px -10px 20px rgba(40, 40, 40, 0.2)');
  }
  var container = $("#records-container");
  var items = records.slice(0, limite);
  $("#records-nb").text(records.length);

  $(container).empty();
  $.each(items, function(i, item) {
    var st = item.type;
    var message = STATUS_CODE[st];
    var ts = extractDateComponents(item.timestamp);
    var d = new Date(item.timestamp);
    var day = d.getUTCDate() + "/" + d.getUTCMonth();
    var fa;
    switch (st) {
      case '0':
        fa = 'fa fa-fw fa-share bad';
        break;
      case '1':
        fa = 'fa fa-fw fa-reply bad';
        break;
      case '2':
        fa = 'fa fa-fw fa-toggle-off neutral';
        break;
      case '3':
        fa = 'fa fa-fw fa-toggle-on neutral';
        break;
      default:
        fa = 'fa fa-fw fa-question';
    }

    if (day != currentDay) {
      currentDay = day;
      var date_comp = $('<li>').append($('<div class="todo-content date-comp">')
                                      .append('<i class="fa fa-clock-o fa-fw">')
                                      .append('&nbsp;')
                                      .append("Le " + ts.day + "/" + ts.month));
      $(container).append(date_comp);
    }

    var it = $('<li>').append($('<div class="todo-content">')
                              .append($('<p class="todo-name">')
                                      .append('<i class="' + fa + '">')
                                      .append('&nbsp;')
                                      .append(message))
                              .append('<a class="needsInternet opanul delete" id="' + item.id + '"><i class="fa fa-times fa-2x"></a>')
                              .append(ts.hour + ":" + ts.minute + " " + ts.day + "/" + ts.month))
                              .attr('id', 'el_' + item.id);
    $(container).append(it);
  });
  $('.delete').each(function(i, e) {
    var pos = $(e).offset().top;
    $(e).offset({top: pos - 15});
    $(e).removeClass('opanul');
  });
}

function extractDateComponents(str) {
  var ret = {};
  var comps = str.split(/\s/);
  var time = comps[1].split(/:/);
  ret.hour = time[0];
  ret.minute = time[1];
  ret.minute = (parseInt(ret.minute) >= 4 ? (parseInt(ret.minute) - 4) : (parseInt(ret.minute))).toString();
  ret.minute = ret.minute.length === 1 ? "0" + ret.minute : ret.minute;

  comps = comps[0].split(/-/);
  ret.year = comps[0];
  ret.month = comps[1];
  ret.day = comps[2];

  return ret;
}

function onOffline() {
  $(".needsInternet").click(false);
  $(".needsInternet").addClass('disabled');
  alert("Vous avez été déconnecté. Certaines fonctionnalités du site ne seront plus accessibles");
}

function onOnline() {
  $(".needsInternet").off('click');
  $(".needsInternet").removeClass('disabled');
  $(".loader").remove();
}

function populateInOutRatio (records) {
  var inCounter = outCounter = 0;

  $.each(records, function(i, record) {
    var t = record.type;
    switch (t) {
      case '0':
        inCounter++;
        break;
      case '1':
        outCounter++;
      default:
    }
  });

  var data = [{
    value: outCounter,
    color:"#3095F5",
    highlight: "#888",
    label: "Sorties"
  },
  {
    value: inCounter,
    color: "#384F66",
    highlight: "#888",
    label: "Entrées"
  }];

  if (inCounter === 0 && outCounter === 0) {
    return 0;
  } else {
    return data;
  }
}

function populateInOutNumbers(records) {
  var labelsNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  var inNumbers = [0, 0, 0, 0, 0, 0, 0];
  var outNumbers = [0, 0, 0, 0, 0, 0, 0];

  $.each(records, function(i, record) {
    var dayN = new Date(record.timestamp).getDay();
    var t = record.type;
    switch (t) {
      case '0':
        inNumbers[dayN]++;
      break;
      case '1':
        outNumbers[dayN]++;
      default:
    }
  })

  var data = {
    labels: labelsNames,
    datasets: [
      {
        label: "Entrées",
        fillColor: "#384F66",
        strokeColor: "transparent",
        highlightFill: "#888",
        highlightStroke: "transparent",
        data: inNumbers
      },
      {
        label: "Sorties",
        fillColor: "#3095F5",
        strokeColor: "transparent",
        highlightFill: "#888",
        highlightStroke: "transparent",
        data: outNumbers
      }
    ]
  };

  return data;
}
