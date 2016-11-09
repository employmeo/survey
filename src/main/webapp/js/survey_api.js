//
// Survey REST Service API Calls
//

function getRespondant(uuId) {
    $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'respondant/'+uuId,
        success: function(data)
        {
        	respondant = data;
        },
        complete: function() {
        	readyPage();
        }
      });
}

function getRespondantSurvey(uuId) {
    $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'respondant/' + uuId + '/getsurvey',
        success: function(data)
        {
        	survey = data;
        },
        complete: function() {
        	readyPage();
        }
      });
}

function getRespondantByPayrollId(id, asid) {
    $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'survey/' + asid + '/respondantbypayroll/' + id,
        success: function(data)
        {
        	respondant = data;
        },
        complete: function() {
        	readyPage();
        }
      });
}

function getPlainSurveyForNewRespondant(form) {
    $.ajax({
        type: "POST",
        async: true,
        url: servicePath + 'respondant',
        data: $(form).serialize(),
        success: function(data)
        {
        	respondant = data;
        },
        complete: function() {
            readyPage();
        }
      });	
}

function getAccountSurvey(asid) {
    $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'survey/' + asid,
        success: function(data)
        {
        	survey = data;
        },
        complete: function() {
        	readyPage();
        }
      });
}

function putResponse(form, cb) {
	$.ajax({
        type: "PUI",
        async: true,
        url: servicePath + 'response',
        data: $(form).serialize(), 
        success: function(data)
        {
           saveResponse(data);
           cb();
        }
  });
}

function postResponse(response, cb) {
	$.ajax({
        type: "POST",
        async: true,
        url: servicePath + 'response',
        data: JSON.stringify(response),
        contentType: "application/json",
        headers : {
		    'Content-Type': 'application/json',
        	'charset':'UTF-8',
        	'Accept': 'application/json'
        },
        success: function(data)
        {
           saveResponse(data);
           cb();
        }
  });
}

function submitSurvey() {
	var redirect = respondant.redirectUrl;
    $.ajax({
        type: "PUT",
        async: true,
        url: servicePath + 'respondant/' + respondant.respondantUuid + '/submit',
        data : respondant,
        success: function(data)
        {
            window.location.assign(redirect);
        }
      });	
}



