// ON HOLD - VISUAL SURVEY BUILDING FUNCTIONS FOR LATER

function buildVisualSurveyWithRespondantId(uuId) {
    $.ajax({
        type: "POST",
        async: true,
        url: "/survey/getsurvey",
        data: {
        	"respondant_uuid" : uuId,
        	"noRedirect" : true        	
        },
        beforeSend: function() {
        	$('#wait').removeClass('hidden');
        },
        success: function(data)
        {
           assembleVisualSurvey(data);
        },
        complete: function() {
        	$('#wait').addClass('hidden');
        }
      });
}

function getVisualSurveyForNewRespondant(form) {
    $.ajax({
        type: "POST",
        async: true,
        url: "/survey/order",
        data: $(form).serialize(),
        beforeSend: function() {
        	$('#wait').removeClass('hidden');
        },
        success: function(data)
        {
            assembleVisualSurvey(data);
        },
        complete: function() {
        	$('#wait').addClass('hidden');
        }
      });	
}

function submitAnswer(form) {
    $.ajax({
           type: "POST",
           async: true,
           url: "/survey/response",
           data: $(form).serialize(), 
           success: function(data)
           {
              saveResponse(data);
           }
         });    
    nextPage();  
}

function assembleVisualSurvey(collection) {
	var deck = document.getElementById('wrapper');
	respondant = collection.respondant;
	survey = collection.survey;
	questions = survey.questions;

	var card = $('<div />', {});
	var qpanel = $('<div />', {
		 'class' : "qpanel qpanel-default",
		 'style' : "background-image:url('/images/background-1.jpg');"
	});
	var header = $('<div />', {
		 'class' : "qpanel-header text-center",
	}).append($('<h4/>', {	'html': 'Welcome' }));
	var footer = $('<div />', {
		 'class' : "qpanel-footer text-center",
	}).append($('<h4/>', {	'text': 'Swipe Left to Begin  ' }).append($('<i/>',{
		'class': "fa fa-play-circle-o", 
		'onClick':'nextPage();'
		})
	));
	qpanel.append(header);
	qpanel.append(footer);
	card.append(qpanel);
	card.appendTo(deck);
	
	$.each(questions, function(index, question) {
		 card = $('<div />', {});
		 qpanel = $('<div />', {
			 'class' : "qpanel qpanel-default",
			 'style' : "background-image:url('/images/question-"+question.question_display_id+".jpg');"
		 });
		 header = $('<div />', {
			 'class' : "qpanel-header text-center",
		 }).append($('<h4/>', {	'text': question.question_text }));
		 footer = $('<div />', {
			 'class' : "qpanel-footer text-center",
		 }).append(getResponseForm(question, respondant));
		 qpanel.append(header);
		 qpanel.append(footer);
		 card.append(qpanel);
		 card.appendTo(deck);
	});
	
	card = $('<div />', {});
	qpanel = $('<div />', {
		 'class' : "qpanel qpanel-default",
		 'style' : "background-image:url('/images/background-1.jpg');"
	});
	header = $('<div />', {
		 'class' : "qpanel-header text-center",
	}).append($('<h4/>', {	'text': 'Thank You' }));
	footer = $('<div />', {
		 'class' : "qpanel-footer text-center",
	}).append($('<button/>', {
		'class' : 'button btn-block',
		'style' : 'font-family: Comfortaa;font-size: 24px;',
		'type': 'button',
		'text': 'Click to Submit',
		'onClick':'window.location.assign(\"'+'/respondant_score.jsp?&respondant_id='+respondant.respondant_id+'\");'
		}));
	
	qpanel.append(header);
	qpanel.append(footer);
	card.append(qpanel);
	card.appendTo(deck);

	responses = new Array();
}


function getResponseForm(question, respondant) {
	var form =  $('<form />', {
		 'name' : 'question_'+question.question_id,
		 'action' : "/response"
	 });
	form.append($('<input/>', {
		name : 'response_id',
		type : 'hidden',
		id : 'qr'+question.question_id,
		value : ''
	}));
	form.append($('<input/>', {
		name : 'response_respondant_id',
		type : 'hidden',
		value : respondant.respondant_id
	}));
	form.append($('<input/>', {
		name : 'response_question_id',
		type : 'hidden',
		value : question.question_id
	}));
	
	switch (question.question_type) {
	case 1:
		break;
	case 2:
		var thumbs = $('<div />', {
			'class' : 'thumbs'
		});
		thumbs.append($('<input/>', {
			'class': 'thumbs-up',
			'id': "thumbs-up-" + question.question_id,
			'type': "radio",
			'name': "response_value",
			'onclick': 'submitAnswer(this.form)',
			'value': 11
		}));
		thumbs.append($('<label/>', {
			'class': 'thumbs-up',
			'for': "thumbs-up-" + question.question_id,
			'text': 'Me'			
		}));
		thumbs.append($('<input/>', {
			'class': 'thumbs-down',
			'id': "thumbs-down-" + question.question_id,
			'type': "radio",
			'name': "response_value",
			'onclick': 'submitAnswer(this.form)',
			'value': 1
		}));
		thumbs.append($('<label/>', {
			'class': 'thumbs-down',
			'for': "thumbs-down-" + question.question_id,
			'text': 'Not Me'
		}));
		form.append(thumbs);
		break;
	case 4:
		form.append($('<div />', {
			'class' : 'stars text-center',
			'style' : 'font-size: 18px;',
			'text' : 'Rate on a scale of 1-5'
		}));
		var stars = $('<div />', {
			'class' : 'stars'
		});

		for (var i = 1; i <=11; i+= 2) {
			stars.append($('<input/>',{
				'class' : 'star star-' + i,
				'id' : 'star-' + i + '-' + question.question_id,
				'type': 'radio',
				'name': "response_value",
				'onclick': 'submitAnswer(this.form)',
				'value': i
			}));
			stars.append($('<label/>',{
				'class' : 'star star-' + i,
				'for' : 'star-' + i + '-' + question.question_id				
			}));
		}
		form.append(stars);
		break;
	case 5:
		form.append($('<div />', {
			'class' : 'likert text-center',
			'style' : 'font-size: 18px;',
			'text' : 'Disagree | Neutral | Agree  '
		}));
		var likert = $('<div />', {
			'class' : 'likert'
		});

		for (var i = 1; i <=11; i+= 2) {
			likert.append($('<input/>',{
				'class' : 'likert likert-' + i,
				'id' : 'likert-' + i + '-' + question.question_id,
				'type': 'radio',
				'name': "response_value",
				'onclick': 'submitAnswer(this.form)',
				'value': i
			}));
			likert.append($('<label/>',{
				'class' : 'likert likert-' + i,
				'for' : 'likert-' + i + '-' + question.question_id				
			}));
		}		
		form.append(likert);
		break;
	case 4:
		break;
	case 6:
		break;
	}	
	return form;
}

function createVisualNewRespondant(surveyId, accountId) {
	  // code to create a form to fill out for a new survey respondant	
}