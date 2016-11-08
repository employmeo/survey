//
// Global Variables and actions for the survey page(s)
//

var urlParams;
var collection;
var respondant;
var survey;
var activeSection;
var questions;
var totalpages;
var responses;
var pagination;
var progress;
var sections;
var endAt;
var timeinterval;

(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
})();


//
// Rest Service Calls
//

function submitPlainAnswer(form, pagenum) {
    $.ajax({
           type: "POST",
           async: true,
           url: "/survey/response",
           data: $(form).serialize(), 
           success: function(data)
           {
              saveResponse(data);
              isPageComplete(pagenum);
           }
         });
}

function buildPlainSurveyWithRespondantId(uuId) {
    $.ajax({
        type: "POST",
        async: true,
        url: "/survey/getsurvey",
        data: {
        	"respondant_uuid" : uuId       	
        },
        beforeSend: function() {
        	$('#wait').removeClass('hidden');
        },
        success: function(data)
        {
        	if (data.message != null) {
        		showAssessmentNotAvailable(data);
        	} else {
                assemblePlainSurvey(data);        		
        	}
        },
        complete: function() {
        	$('#wait').addClass('hidden');
        }
      });
}

function getSurveyByPayrollId(form) {
    $.ajax({
        type: "POST",
        async: true,
        url: "/survey/getbypayrollid",
        data: $(form).serialize(),
        beforeSend: function() {
        	$('#wait').removeClass('hidden');
        },
        success: function(data)
        {
        	if (data.message != null) {
        		showIdNotFound(data);
        	} else {
                assemblePlainSurvey(data);        		
        	}
        },
        complete: function() {
        	$('#wait').addClass('hidden');
        }
      });	
}

function getPlainSurveyForNewRespondant(form) {
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
            assemblePlainSurvey(data);
        },
        complete: function() {
        	$('#wait').addClass('hidden');
        }
      });	
}

function submitSurvey() {
	var redirect = respondant.respondant_redirect_url;
    $.ajax({
        type: "POST",
        async: true,
        url: "/survey/submitassessment",
        data: {'respondant_id' : respondant.respondant_id},
        success: function(data)
        {
            window.location.assign(redirect);
        }
      });	
}

// Pagination Code
function nextPage() {
	var pageType = $('.carousel-inner div.active').attr('page-type');
	var allowed = false;
	switch (pageType) {
	case "0": // Pre-amble
		allowed = true;
		break;
	case "1": // Instructions
		if (activeSection.section_timed) {
			allowed = (endAt != null);
		} else {
			$('#progress').removeClass('hidden');	
			allowed = true;
		}
		break;
	default: // "2"=thank you "3"=questions
		allowed = isPageComplete($('.carousel-inner div.active').index() + 1);
		break;
	}
	if (allowed) {
		$('#survey').carousel("next");
		window.scrollTo(0,0);		
	} else {
		// TODO - some sort of user feedback to show page is incomplete
	}
}

function prevPage() {
	var pageType = $('.carousel-inner div.active').attr('page-type');
	if (pageType == "3") {
		$('#survey').carousel("prev");
		window.scrollTo(0,0);
	} else {
		// TODO - some sort of user feedback to show can't go backwards		
	}
	
}

function isPageComplete(pagenum) {
	var qlist = pagination[pagenum];
	var complete = true;
	for (var key in qlist ) {
		if (responses[qlist[key].question_id] == null) complete = false;
	}
	if (complete) {
		var button = '#nextbtn-' + pagenum;
		$(button).attr('disabled', false);
	}
	return complete;
}

function isSurveyComplete() {
	var complete = true;
	for (var key in questions ) {
		if (responses[questions[key].question_id] == null) complete = false;
	}
	return complete;
}

// Error Handling Functions
function showAssessmentNotAvailable(data) {
	  // code to create a form to fill out for a new survey respondant	
		var deck = document.getElementById('wrapper');
		$(deck).empty();
		totalpages = 1;
		var card = $('<div />', {
			'class' : 'item active'
		});		
		card.append(getHrDiv());
		card.append($('<div />', {
			'class' : 'col-xs-12 col-sm-12 col-md-12',
			}).append($('<h3 />', { 'class' : 'text-center', 'text' : data.message})));
		card.append(getHrDiv());
		card.appendTo(deck);
}

//Error Handling Functions
function showIdNotFound(data) {
	  // code to create a form to fill out for a new survey respondant	
		var deck = document.getElementById('wrapper');
		$(deck).empty();
		totalpages = 1;
		var card = $('<div />', {
			'class' : 'item active'
		});		
		card.append(getHrDiv());
		card.append($('<div />', {
			'class' : 'col-xs-12 col-sm-12 col-md-12',
			}).append($('<h3 />', { 'class' : 'text-center', 'text' : data.message})));

		card.append($('<div />', {
			'class' : 'col-xs-12 col-sm-12 col-md-12 text-center',
		}).append($('<button />',{
					'type' : 'button',
					'class' : 'btn btn-primary',
					'onClick' : 'buildLookupSurvey(urlParams.account_id);',
					'text' : 'Try Again'
				})));								
		card.append(getHrDiv());
		card.appendTo(deck);
}

function createPlainNewRespondant(surveyId, accountId) {
  // code to create a form to fill out for a new survey respondant	
	var deck = document.getElementById('wrapper');
	$(deck).empty();
	var infopage = $('<div />', {});
	
	infopage.append(getHrDiv());
	infopage.append($('<div />', {
		'class' : 'col-xs-12 col-sm-12 col-md-12',
		}).html("<h3>Applicant Info</h3>"));
	infopage.append(getHrDiv());

	var form = $('<form />',{
		'class' : 'form'
	});
	form.append($('<input />', {
		'type' : 'hidden',
		'name' : 'account_id',
		'value' : accountId
	}));
	form.append($('<input />', {
		'type' : 'hidden',
		'name' : 'survey_id',
		'value' : surveyId		
	}));

	/* First Name */
	form.append($('<label />', {
		'for' : 'fname',
		'text' : 'First Name:'
	}));
	
	var row = $('<div />', {
		'class' : 'input-group has-feedback'
	});
	row.append($('<span />', {
		'class' : 'input-group-addon'}).html("<i class='fa fa-user fa-fw'></i>"));
	row.append($('<input />', {
		'class' : 'form-control',
		'type' : 'text',
		'name' : 'fname',
		'placeholder' : 'First Name',
		'required' : true				
	}));
	form.append(row);

	/* Last Name */
	form.append($('<label />', {
		'for' : 'lname',
		'text' : 'Last Name:'
	}));
    row = $('<div />', {
			'class' : 'input-group has-feedback'
		});
	row.append($('<span />', {
		'class' : 'input-group-addon'}).html("<i class='fa fa-user fa-fw'></i>"));
	row.append($('<input />', {
		'class' : 'form-control',
		'type' : 'text',
		'name' : 'lname',
		'placeholder' : 'Last Name',
		'required' : true				
	}));
	form.append(row);

	/* Email */	
	form.append($('<label />', {
		'for' : 'email',
		'text' : 'E-mail Address:'
	}));
	row = $('<div />', {
		'class' : 'input-group has-feedback'
	});
	row.append($('<span />', {
	'class' : 'input-group-addon'}).html("<i class='fa fa-envelope fa-fw'></i>"));
	row.append($('<input />', {
		'class' : 'form-control',
		'type' : 'email',
		'name' : 'email',
		'placeholder' : 'email',
		'required' : true		
	}));
	form.append(row);

	/* Home Address */
	form.append($('<label />', {
		'for' : 'address',
		'text' : 'Home Address:'
	}));
	row = $('<div />', {
		'class' : 'input-group has-feedback'
	});
	row.append($('<span />', {
	'class' : 'input-group-addon'}).html("<i class='fa fa-home fa-fw'></i>"));
	row.append($('<input />', {
		'class' : 'form-control',
		'type' : 'text',
		'name' : 'address',
		'id' : 'address',
		'required' : true				
	}));
	form.append(row);
	
	/* Button */
	form.append(getHrDiv());
	form.append($('<input />', {
		'type' : 'hidden',
		'name' : 'lat',
		'id' : 'lat'
	}));
	form.append($('<input />', {
		'type' : 'hidden',
		'name' : 'lng',
		'id' : 'lng'				
	}));
	form.append($('<input />', {
		'type' : 'hidden',
		'name' : 'formatted_address',
		'id' : 'formatted_address'				
	}));
	form.append($('<input />', {
		'type' : 'hidden',
		'name' : 'country_short',
		'id' : 'country_short'				
	}));
	form.append($('<button />', {
		'type' : 'button',
		'class' : 'btn btn-primary',
		'onClick' : 'getPlainSurveyForNewRespondant(this.form);',
		'text' : 'Submit'
	}));

	infopage.append($('<div />', {
		'class' : 'col-xs-12 col-sm-12 col-md-12',
		}).append(form));
	infopage.appendTo(deck);
	
	$('#address').geocomplete({details:'form'});
}

// 
function buildLookupSurvey(accountId) {
	  // code to create a form to fill out for a new survey respondant	
		var deck = document.getElementById('wrapper');
		$(deck).empty();
		var infopage = $('<div />', {});
		infopage.append(getHrDiv());
		infopage.append($('<div />', {
			'class' : 'col-xs-12 col-sm-12 col-md-12 text-center',
			}).html("<h3>Enter Employee ID</h3>"));
		infopage.append(getHrDiv());

		var form = $('<form />',{
			'class' : 'form'
		});
		form.append($('<input />', {
			'type' : 'hidden',
			'name' : 'account_id',
			'value' : accountId
		}));
		form.append($('<label />', {
			'for' : 'fname',
			'text' : 'Employee ID:'
		}));
		
		var row = $('<div />', {
			'class' : 'input-group has-feedback'
		});
		row.append($('<span />', {
			'class' : 'input-group-addon'}).html("<i class='fa fa-user fa-fw'></i>"));
		row.append($('<input />', {
			'class' : 'form-control',
			'type' : 'text',
			'name' : 'payroll_id',
			'placeholder' : 'ID#',
			'required' : true			
		}));
		form.append(row);
		form.append(getHrDiv());
		form.append($('<div />', {
			'class' : 'col-xs-12 col-sm-12 col-md-12 text-center',
			}).append($('<button />', {
			'type' : 'button',
			'class' : 'btn btn-primary',
			'onClick' : 'getSurveyByPayrollId(this.form);',
			'text' : 'Submit'
		})));

		infopage.append($('<div />', {
			'class' : 'col-xs-12 col-sm-12 col-md-12',
			}).append(form));
		infopage.append(getHrDiv());
		infopage.appendTo(deck);
}


//
// Survey page building functions
//

function assemblePlainSurvey(data) {
	collection = data;
	var deck = document.getElementById('wrapper');
	respondant = collection.respondant;
	survey = collection.survey;
	sections = survey.sections.sort(function(a,b) {
		return a.section_number < b.section_number ? -1:1;
	});
	questions = survey.questions.sort(function(a,b) {
		if (a.question_page == b.question_page) {
			return a.question_sequence < b.question_sequence ? -1:1;
		} else {
			return a.question_page < b.question_page ? -1:1;
		}});;
	
	// Store Responses by Question ID
	responses = new Array();
	if (collection.responses != null) {
		for (var i=0;i<collection.responses.length;i++) {
			responses[collection.responses[i].response_question_id] = collection.responses[i];
		}
	}
	
	activeSection = null;
	// Analyze Sections to see if any are already finished
	for (var key in sections) {
		var section = sections[key];
		section.qtotal = 0;
		for (var q in questions) {
			if (questions[q].question_page == section.section_number) section.qtotal++;
		}
		section.complete = false;
		if (section.section_all_required) {
			section.complete = isAllReqSectionComplete(section.section_number);
		} else if (section.section_timed) {
			section.complete = isTimedSectionStarted(section.section_number);
		}
		if ((activeSection == null) && (!section.complete)) activeSection = section;
	}

	$(deck).empty();	
	getPreamble().appendTo(deck);
	if (activeSection != null) {
		createSurveySection(deck, activeSection);
	} else {
		getThankYouPage().appendTo(deck);
	}
}



function createSurveySection(deck, section) {
	var pagecount = $(deck).children().length + 1; // starts at two, assumes pre-amble and instructions
	pagination = new Array();
	var qlimit = section.section_questions_per_page; // questions per page
	totalpages = Math.ceil(section.qtotal / qlimit) + pagecount;
	
	var card = getInstructions(section, pagecount, totalpages);
	card.appendTo(deck);
	pagecount++;
	
	if (section.section_timed) {
		updateTimer();
	} else {
		updateProgress();		
	}
	$('#progress').addClass('hidden');
	$('#timer').addClass('hidden');

	var qcount = 0;
	var qpp = 0;
	card = $('<div />', {'class' : 'questionpage item'});
	card.append(getHrDiv());
	pagination[pagecount] = new Array();
	
	for (var q=0;q<questions.length;q++) {
		var question = questions[q];
		if (question.question_page == section.section_number) {
				qcount++;
				if (qpp == qlimit) {
					card.append(getSurveyNav(pagecount, totalpages, 5));	
					card.attr('page-type',3);
					card.appendTo(deck);
					pagecount++;
					pagination[pagecount] = new Array();
					qpp = 0;
					card = $('<div />', {'class' : 'questionpage item'});
					card.append(getHrDiv());				
				}
				var pageqs = pagination[pagecount];
				pageqs[qpp] = question;
				qpp++;
				var questionrow = $('<div />');
				questionrow.append(getDisplayQuestion(question, qcount));
				questionrow.append(getPlainResponseForm(question, respondant, qcount, pagecount));	
				card.append(questionrow);
				card.append(getHrDiv());
		}
	}
	card.append(getSurveyNav(pagecount, totalpages,3));	
	card.attr('page-type',3);
	card.appendTo(deck);		
	// Done with section questions, put in footer as "complete"
	
	if (collection.responses != null) {
		for (var i=0;i<collection.responses.length;i++) {
			saveResponse(collection.responses[i]);
			var radios =$('form[name=question_'+collection.responses[i].response_question_id+
    		'] :input[name=response_value][value=' + collection.responses[i].response_value + ']');
		    $(radios).prop('checked', true);
		}		
	}
	for (var i=1;i<=totalpages;i++) {
		isPageComplete(i);
	}

}
	
// Show Assessment Preamble
function getPreamble() {
	var preamble = $('<div />', {'class' : 'item active'});
	
	preamble.append(getHrDiv());
	preamble.append($('<div />', {
		'class' : 'col-xs-12 col-sm-12 col-md-12',
		}).html(survey.survey_preamble_text));
	preamble.append(getHrDiv());
	preamble.append(getSurveyNav(1, null, 1));	
	preamble.attr('page-type',0);
	return preamble;
}

//Show Section Instructions
function getInstructions(section) {
	var instr = $('<div />', {'class' : 'item', 'id' : 'instructions'});
	
	instr.append(getHrDiv());
	instr.append($('<h4 />', {
		'text' : 'Section ' + section.section_number + ' of ' + sections.length,
		'class' : 'text-center'
	}));
	instr.append(getHrDiv());
	instr.append($('<div />', {
		'class' : 'col-xs-12 col-sm-12 col-md-12',
		}).html(section.section_instructions));
	instr.append(getHrDiv());
	instr.append(getSurveyNav(2, null, 2));	
	instr.attr('page-type',1);
	return instr;
}

//Show Thank You + Completion
function getThankYouPage() {
	var thanks = $('<div />', {'class' : 'item'});
	
	thanks.append(getHrDiv());
	thanks.append($('<div />', {
		'class' : 'col-xs-12 col-sm-12 col-md-12',
		}).html(survey.survey_thankyou_text));
	thanks.append(getHrDiv());
	thanks.append(getSurveyNav(null, null, 4));	

	thanks.attr('page-type',2);

	return thanks;
}



// create the question / response form
function getDisplayQuestion(question, qnum) {
	var qtextdiv = $('<div />', {'class' : 'col-xs-12 col-sm-6 col-md-6 questiontext'})

	if (question.question_type == 15) { //change display for alike / unlike
		qtextdiv.append($('<p />',{
			'text' : 'Are these two Alike or Unlike',
			'qnum' : qnum
		}));
		qtextdiv.append($('<div />', {
			'class' : 'col-xs-6 col-sm-6 col-md-6 questiontext text-center',
			'text' : question.answers[0].answer_text
				}));
		qtextdiv.append($('<div />', {
			'class' : 'col-xs-6 col-sm-6 col-md-6 questiontext text-center',
			'text' : question.answers[1].answer_text
				}));
	} else {
		qtextdiv.append($('<p />',{
			'html' : question.question_text,
			'qnum' : qnum
		}));
	}
	
	return qtextdiv;
}

function getPlainResponseForm(question, respondant, qcount, pagecount) {
	var ansblock = $('<div />', {'class' : 'col-xs-12 col-sm-6 col-md-6'});

	question.answers.sort(function(a,b) {
		return a.answer_display_id < b.answer_display_id ? -1:1;
	});
	
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
	case 9: // five short ans
	case 11: // two short ans
	case 12: // four short ans
	case 7: // yes-idk-no
	case 8: // yes-sometimes-no
	case 10: // yes-notsure-no
	case 13: // other, multi-three-choice
		var ansdiv = $('<div />');
		for (var ans=0;ans<question.answers.length;ans++) {
			var answer = question.answers[ans];
			var qrespdiv = $('<div />', {
				'style' : 'padding-right: 1px; padding-left: 1px;',
				'class' : 'col-xs-4 col-sm-4 col-md-4'
			});
			var radiobox = $('<input />', {
				'id'   : 'radiobox-' + question.question_id +"-"+ answer.answer_value,
				'type' : 'radio',
				'class' : 'radio-short',
				'name' : 'response_value',
				'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')',
				'value' :  answer.answer_value
			});
			var radiolabel = $('<label />', {
				'for'   : 'radiobox-' + question.question_id +"-"+ answer.answer_value,
				'class' : 'radio-short',
				'text'  :  answer.answer_text.toUpperCase()
			});
		
			qrespdiv.append(radiobox);
			qrespdiv.append(radiolabel);

			ansdiv.append(qrespdiv);
		}
		form.append(ansdiv);
		break;
	case 1: // multiple choice (checkbox)
	case 2: // Me - Not Me
	case 3: // Schedule (not used)
	case 4: // Likert (Stars)
		break;
	case 5: // Likert (Boxes)
		var ansdiv  = $('<div />', {
			'class' : 'likertboxes'
		});
		var list = $('<ul />');
		var labels = $('<ul />');
		for (var ans=0;ans<question.answers.length;ans++) {
			var answer = question.answers[ans];
			var i = ans +1;
			var scale = $('<li />');
			scale.append($('<input/>',{
				'class' : 'likertbox likertbox-' + i,
				'id' : 'likertbox-' + i + '-' + question.question_id,
				'type': 'radio',
				'name': "response_value",
				'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')',
				'value': answer.answer_value
			}));
			scale.append($('<label/>',{
				'class' : 'likertbox likertbox-' + i,
				'for' : 'likertbox-' + i + '-' + question.question_id				
			}));
			list.append(scale);
		}
		labels.append($('<li />', { text : 'Strongly Disagree' }));
		labels.append($('<li />', { text : 'Disagree' }));
		labels.append($('<li />', { text : 'Neutral' }));
		labels.append($('<li />', { text : 'Agree' }));
		labels.append($('<li />', { text : 'Strongly Agree' }));

		ansdiv.append(list);
		ansdiv.append(labels);
		form.append(ansdiv);
		break;
	case 14: // Rank
		var responseInp = $('<input />', {
			'id'   : 'ranker-' + question.question_id,
			'type' : 'hidden',
			'class' : 'hidden',
			'name' : 'response_value',
			'value' :  '12345'
		});
		form.append(responseInp);
		var listdiv = $('<div />');
		listdiv.append($('<div />', {
			'class' : 'instructions',
			'text' : 'Drag options to rank most preferred (1) to least (5)'
		}));
		var sortablelist = $('<ol />', {
			'id' : 'sortable-' + question.question_id,
			'class' : 'ranker'});
		for (var ans=0;ans<question.answers.length;ans++) {
			var answer = question.answers[ans];
			var listitem = $('<li />', {
				'data-value' : answer.answer_value
			});
			var span = $('<span />', {'text' : answer.answer_text });
			listitem.append($('<i />', {
				'class' : 'fa fa-long-arrow-up pull-right',
				'onClick': 'rankUp('+question.question_id+','+ answer.answer_value+')'
			}));
			listitem.append($('<i />', {
				'class' : 'fa fa-long-arrow-down pull-right',
				'onClick': 'rankDown('+question.question_id+','+ answer.answer_value+')'
			}));
			listitem.append(span);
			sortablelist.append(listitem);
		}
		sortablelist.sortable({stop: 
			function(event, ui){updateRankerIndexes(question.question_id);}});
		
		listdiv.append(sortablelist);

		listdiv.append($('<div />', {
			'class' : 'text-right'
		}).append($('<button />', {
				'type' : 'button',
				'id' : 'saverank-' + question.question_id, 
				'class' : 'ranker-button',
				'text' : "Save",
				'onClick':'submitRank(this.form,'+question.question_id+','+pagecount+');',
				'disabled' : true
			})));
		form.append(listdiv);

		break;
	case 15: // Alike / Unlike
		var ansdiv = $('<div />');
		var alikediv = $('<div />', {'class' : 'col-xs-6 col-sm-6 col-md-6'});
		alikediv.append($('<input />', {
			'id'   : 'radiobox-' + question.question_id +"-1",
			'type' : 'radio', 'class' : 'radio-short', 'name' : 'response_value',
			'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')', 'value' :  '1'}));
		alikediv.append($('<label />', {
			'for'   : 'radiobox-' + question.question_id +"-1", 'class' : 'radio-short',
			'text'  :  'ALIKE' }));
		var unlikediv = $('<div />', {'class' : 'col-xs-6 col-sm-6 col-md-6'});
		unlikediv.append($('<input />', {
			'id'   : 'radiobox-' + question.question_id +"-2",
			'type' : 'radio', 'class' : 'radio-short', 'name' : 'response_value',
			'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')', 'value' :  '2'}));
		unlikediv.append($('<label />', {
			'for'   : 'radiobox-' + question.question_id +"-2", 'class' : 'radio-short',
			'text'  :  'UNLIKE' }));
		ansdiv.append(alikediv);
		ansdiv.append(unlikediv);
		form.append(ansdiv);
		break;
	case 6: // Multiple Choice (radio)
	default:
		// basic multichoice
		for (var ans=0;ans<question.answers.length;ans++) {
			var answer = question.answers[ans];
			var qrespdiv = $('<div />', {
				'class' : 'col-xs-12 col-sm-12 col-md-12'
			});
			var radiolabel = $('<label />', {
				'for'   : 'radiobox-' + question.question_id +"-"+ answer.answer_value,
				'class' : 'radio-select',
				'text'  :  answer.answer_text
			});
			var radiobox = $('<input />', {
				'id'   : 'radiobox-' + question.question_id +"-"+ answer.answer_value,
				'type' : 'radio',
				'class' : 'radio-select',
				'name' : 'response_value',
				'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')',
				'value' :  answer.answer_value
			});

			form.append(radiobox);
			form.append(radiolabel);
		}
		break;
		break;
	}
	ansblock.append(form);
	return ansblock;
}

function getHrDiv () {
	return $('<div />', {
		'class': 'col-xs-12 col-sm-12 col-md-12',
		'html': '<hr>'
	});
}

function getSurveyNav(pagecount, totalpages, pageType) {
	var navigation = $('<div />', {'class': 'container-fluid'});
	var leftnav = $('<div />', {'class': 'col-xs-4 col-sm-4 col-md-4 text-center'});
	var centernav = $('<div />', {'class': 'col-xs-4 col-sm-4 col-md-4 text-center'});
	var rightnav = $('<div />', {'class': 'col-xs-4 col-sm-4 col-md-4 text-center'});	
	var nextbutton = $('<button />', {
		'id' : 'nextbtn-' + pagecount, 
		'class' : 'btn btn-primary',
		'text' : "Next >>",
		'onClick':'nextPage();' });
	
	switch (pageType) {
	case 1: //First Page
		$(nextbutton).text('I Agree');
		centernav.append(nextbutton);
		break;
	case 2: //Instruction Page
		$(nextbutton).text('Start');
		nextbutton.attr('id','startbutton');
		nextbutton.attr('onClick','startAssessment();');
		centernav.append(nextbutton);
		break;
	case 3: //Last page of Section
		leftnav.append($('<button />', {
			'id' : 'prevbtn-' + pagecount, 
			'class' : 'btn btn-primary',
			'text' : "<< Back",
			'onClick':'prevPage();'
		}));
		$(nextbutton).text('Complete');
		nextbutton.attr('disabled', true);
		nextbutton.attr('onClick','submitSection();');
		$(centernav).text('Page '+ pagecount + ' of ' + totalpages);
		rightnav.append(nextbutton);
		break;
	case 4: //Survey Complete (Thank You Page)
		$(nextbutton).text('Submit');
		nextbutton.attr('onClick','submitSurvey();');
		centernav.append(nextbutton);
		break;
	case 5: //Question Page
	default:
		$(centernav).text('Page '+ pagecount + ' of ' + totalpages);
		nextbutton.attr('disabled', true);
		rightnav.append(nextbutton);
		leftnav.append($('<button />', {
			'id' : 'prevbtn-' + pagecount, 
			'class' : 'btn btn-primary',
			'text' : "<< Back",
			'onClick':'prevPage();'
		}));
		break;
	}
	
	navigation.append(leftnav);
	navigation.append(centernav);
	navigation.append(rightnav);
	
	return navigation;
}

function submitSection() {
	activeSection.complete=true;
	if (endAt != null) {
		endAt = null;
		clearInterval(timeinterval);
	}
	var nextSection = null;
	for (var key in sections) {
		var section = sections[key];
		if ((nextSection == null) && (!section.complete)) nextSection = section;
	}
	var deck = document.getElementById('wrapper');
	if(nextSection != null) {
		activeSection = nextSection;
		$(deck).empty();
		createSurveySection(deck, activeSection);
		$('#instructions').addClass('active');
	} else {
		getThankYouPage().appendTo(deck);
		nextPage();
	}
}


function isPageComplete(pagenum) {
	var complete = true;
	if (activeSection != null) {
		if(activeSection.section_all_required) {
			var qlist = pagination[pagenum];
			for (var key in qlist ) {
				if (responses[qlist[key].question_id] == null) complete = false;
			}
		}
	}
	if (complete) {
		var button = '#nextbtn-' + pagenum;
		$(button).attr('disabled', false);
	}
	return complete;
}

function isAllReqSectionComplete(sectionnum) {
	var complete = true;
	for (var key in questions ) {
		if ((questions[key].question_page == sectionnum) &&
		    (responses[questions[key].question_id] == null)) complete = false;
	}
	return complete;
}

function isTimedSectionStarted(sectionnum) {
	var started = false;
	for (var key in questions ) {
		if ((questions[key].question_page == sectionnum) &&
		    (responses[questions[key].question_id] != null)) started = true;
	}
	return started;
}

function isSurveyComplete() {
	var complete = true;
	for (var key in questions ) {
		if (responses[questions[key].question_id] == null) complete = false;
	}
	return complete;
}

function saveResponse(response) {
	responses[response.response_question_id] = response;
    var field = '#qr' + response.response_question_id;
    $(field).val(response.response_id);

    if (activeSection.section_all_required) {
    	updateProgress();
    }
    
    return;
}

function updateProgress() {
    var totalresponses = 0;
    for (var q in questions) { ques = questions[q]; 
	    if (responses[ques.question_id] !=null) {
	    	if (ques.question_page == activeSection.section_number) totalresponses++;
	    }
    } 
    progress = 100* totalresponses / activeSection.qtotal;
    $('.progress-bar').attr('style','width:'+progress+'%;');
    $('.progress-bar').attr('aria-valuenow',progress);
	
}

function startAssessment() {
	if (activeSection.section_timed) {
		startTimer();
		$('#startbutton').text('Continue');
		$('#startbutton').attr('onClick','nextPage();');
		nextPage();
	} else {
		$('#honesty').modal();
	}
}

function startTimer() {
	var t = 1000 * activeSection.section_time_seconds;
	$('#timer').removeClass('hidden');

	endAt = Date.parse(new Date()) + t;
	timeinterval = setInterval(function(){
		if (endAt !=null) {
			var t = endAt - Date.parse(new Date());
			updateTimer();
		    if(t<=0){
		    	timesUp();
		    }
		}
	},1000);
}
function timesUp() {
	clearInterval(timeinterval);
	endAt = null;
    $('#timesup').modal();
	submitSection();
}

function updateTimer(){
	var t = 1000 * activeSection.section_time_seconds;
	if (endAt !=null) {
	  t = endAt - Date.parse(new Date());
	}
	var secs = Math.floor( (t/1000) % 60 );
	var mins = Math.floor( (t/1000/60) % 60 );
	$('#timer').text(mins + ':' + (secs<10 ? '0':'') + secs);
	if (mins > 0) {
		$('#timer').removeClass('text-danger');
	} else {
		$('#timer').addClass('text-danger');
		if (Math.floor(secs % 10) == 0) {
			$('#timer').fadeOut(100).fadeIn(100);
		}
	}
}

function rankUp(id, num){
	var items = $('#sortable-'+id).children();
	var currentIndex = -1; // not found yet
	for (var index in items) { 
		if ((currentIndex == -1) && ($(items[index]).attr('data-value') == num)) currentIndex = index;
	}
	if (currentIndex > 0) {
		$(items[currentIndex]).fadeOut(100);
		$(items[currentIndex]).insertBefore(items[(currentIndex-1)]);
		$(items[currentIndex]).fadeIn(100);
	}
	updateRankerIndexes(id);
}

function rankDown(id, num){
	var items = $('#sortable-'+id).children();
	var currentIndex = -1; // not found yet
	for (var index in items) { 
		if ((currentIndex == -1) && ($(items[index]).attr('data-value') == num)) currentIndex = index;
	}
	currentIndex++;
	if ((currentIndex > 0) && (currentIndex < (items.length))) {
		$(items[currentIndex-1]).fadeOut(100);
		$(items[currentIndex]).insertBefore(items[currentIndex-1]);
		$(items[currentIndex-1]).fadeIn(100);
	}
	updateRankerIndexes(id);
}

function updateRankerIndexes(id){
	var items = $('#sortable-'+id).children();
	var rankerval = "";
    $(items).each(function(i){
    	rankerval += $(this).attr('data-value');
    });
    $('#ranker-' + id).val(rankerval);
	$('#saverank-'+id).removeClass('ranker-saved');
	$('#saverank-'+id).addClass('ranker-edited');
	$('#saverank-'+id).text('Save');
    $('#saverank-'+id).attr('disabled', false);
}

function submitRank(form, id, pagenum) {
	$('#saverank-'+id).addClass('ranker-saved');
	$('#saverank-'+id).removeClass('ranker-edited');
	$('#saverank-'+id).attr('disabled', true);
	$('#saverank-'+id).text('Saved');
    submitPlainAnswer(form, pagenum);
}
