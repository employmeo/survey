
// stub variables to be removed
var redflagColor = "#d9534f";
var redflagOverlay = "rgba(217, 83, 79,0.3)";
var redflagHighlight = "#d43f3a";

var churnerColor = "#f0ad4e";
var churnerOverlay = "rgba(240, 173, 78, 0.3)";
var churnerHighlight = "#eea236";

var longtimerColor = "#5bc0de";
var longtimerOverlay = "rgba(91, 192, 222,0.3)";
var longtimerHighlight = "#46b8da";

var risingstarColor = "#5cb85c";
var risingstarOverlay = "rgba(92, 184, 92,0.3)";
var risingstarHighlight = "#4cae4c";

var applicantColor = "rgba(120,60,100,1)";
var applicantOverlay = "rgba(120,60,100,0.3)";
var applicantHighlight = "rgba(120,60,100,1)";

// Stub Functions to be removed
function getApplicantData(){
	var data = getDoughnutData();
	data.datasets[0].data = [100, 300, 250, 20]
	return data;
}

function getHireData(){
	var data = getDoughnutData();
	data.datasets[0].data = [2, 75, 125, 15]
	return data;
}

function getDoughnutData() {
	return {
			labels: [
			        "Red Flag",
			        "Churner",
			        "Long Timer",
			        "Rising Star"],
			datasets: [{
				backgroundColor: [
				    redflagColor,
				    churnerColor,
				    longtimerColor,
				    risingstarColor
				    ],
				hoverBackgroundColor: [
   				    redflagHighlight,
				    churnerHighlight,
				    longtimerHighlight,
				    risingstarHighlight
                    ]
			}]        
	};
}	        

function getHistoryData() {
	return {
	    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	    datasets: [
	        {
	            label: "Red Flag",
	            backgroundColor: redflagColor,
	            borderColor: redflagColor,
	            hoverBackgroundColor: redflagOverlay,
	            hoverBorderColor: redflagHighlight,
	            data: [10,2,3,2,1,2,1,2,1,0,0,1]
	        },
	        {
	            label: "Churner",
	            backgroundColor: churnerColor,
	            borderColor: churnerColor,
	            hoverBackgroundColor: churnerOverlay,
	            hoverBorderColor: churnerHighlight,
	            data: [140,150,130,110,130,102,110,90,80,85,80,75]
	        },
	        {
	            label: "Long Timer",
	            backgroundColor: longtimerColor,
	            borderColor: longtimerColor,
	            hoverBackgroundColor: longtimerOverlay,
	            hoverBorderColor: longtimerHighlight,
	            data: [50,55,65,71,86,100,104,120,112,121,118,126]
	        },
	        {
	            label: "Rising Star",
	            backgroundColor: risingstarColor,
	            borderColor: risingstarColor,
	            hoverBackgroundColor: risingstarOverlay,
	            hoverBorderColor: risingstarHighlight,
	            data: [3,5,7,8,7,12,13,17,20,21,22,21]
	        }
	    ]
	};
}

function getPositionTenureData() {
	return {
	    labels: ["1","2","3","4","5","6","7","8","9","10","11","12","14","15","16","17","18"],
	    datasets: [
	        {
	            label: "count",
	            backgroundColor: "rgba(120,220,220,0.2)",
	            borderColor: "rgba(220,120,220,1)",
	            hoverBackgroundColor: "#fff",
	            hoverBorderColor: "rgba(220,220,120,1)",
	            data: [45,15,25,40,45,55,65,50,40,30,20,15,13,14,11,10,9]
	        }
	    ]
	};
}

function getApplicantProfileData() {
	return {
	    labels: ["Openness", "Conscientousness", "Confidence", "Sociability", "Compassion"],
	    datasets: [
	        {
	            label: "Applicant",
	            backgroundColor: "rgba(220,220,220,0.2)",
	            borderColor: "rgba(220,220,220,1)",
	            pointBackgroundColor: "rgba(220,220,220,1)",
	            pointBorderColor: "#fff",
	            pointHoverBackgroundColor: "#fff",
	            pointHoverBorderColor: "rgba(220,220,220,1)",
	            data: [1, 3, 5, 4, 2]
	        },
	        {
	            label: "Average Score",
	            backgroundColor: "rgba(151,187,205,0.2)",
	            borderColor: "rgba(151,187,205,1)",
	            pointBackgroundColor: "rgba(151,187,205,1)",
	            pointBorderColor: "#fff",
	            pointHoverBackgroundColor: "#fff",
	            pointHoverBorderColor: "rgba(151,187,205,1)",
	            data: [4, 3, 4, 2, 1]
	        }
	    ]
	};
}


function getRespondantScore() {
	var jResp = {
		respondant: {
			respondant_person_fname: 'Joe',
			respondant_person_lname: 'White',
			respondant_survey_name: 'Basic Application'
		},
		position: getPositionDetails(),
		scores: {
			'Conscentiousness' : 4.5,
			'Stability' : 4.7,
			'Extraversion' : 4.9,
			'Openness' : 3.7,
			'Drive' : 5				
		}
	};
	return jResp;
}

function getScores(scores, rank) {
	var newscores = new Array();
	for (var key in scores) {
		if (scores.hasOwnProperty(key)) {
			newscores[key] = Math.round(100*(5 + Math.random()- rank))/100;
		}
	}
	return newscores;
	
}

function getPositionDetails() {
	var scores = {
			'Conscentiousness' : 4.5,
			'Stability' : 4.7,
			'Extraversion' : 4.9,
			'Openness' : 3.7,
			'Drive' : 5				
		};
	return getPositionDetails(scores);
}
function getPositionDetails(scores) {
	
	var corefactors = new Array();
	var index = 0;
	
	for (var key in scores) {
		if (scores.hasOwnProperty(key)) {
			corefactors[index] = key;
			index++;
		}
	}

	var position = {
			position_name: 'Clerk',
			position_corefactors: corefactors,
			position_profiles: [{
			    	 profile_name: 'Rising Star',
			    	 profile_class: 'btn-success',
			    	 profile_color: risingstarColor,
			    	 profile_highlight: risingstarHighlight,
			    	 profile_overlay: risingstarOverlay,
			    	 profile_scores: getScores(scores, 1),
			    	 profile_probability: 3,
			    	 profile_tenure_data: {
			    		    labels: ["1","2","3","4","5","6","7","8","9","10","11","12","14","15","16","17","18"],
			    		    datasets: [{ data: [2,3,1,1,2,2,3,4,4,5,10,15,25,30,33,30,25] }]
			    	}
				},
			     {
			    	 profile_name: 'Long Timer',
			    	 profile_class: 'btn-info',
			    	 profile_color: longtimerColor,
			    	 profile_highlight: longtimerHighlight,
			    	 profile_overlay: longtimerOverlay,
			    	 profile_scores: getScores(scores, 2),
			    	 profile_probability: 61,
			    	 profile_tenure_data: {
			    		    labels: ["1","2","3","4","5","6","7","8","9","10","11","12","14","15","16","17","18"],
			    		    datasets: [{ data: [3,5,10,20,35,45,65,70,50,40,30,25,18,14,11,10,9] }]
			    	 }
			     },
			     {
			    	 profile_name: 'Churner',
			    	 profile_class: 'btn-warning',
			    	 profile_color: churnerColor,
			    	 profile_highlight: churnerHighlight,
			    	 profile_overlay: churnerOverlay,
			    	 profile_scores: getScores(scores, 3),
			    	 profile_probability: 26,
			    	 profile_tenure_data: {
			    		    labels: ["1","2","3","4","5","6","7","8","9","10","11","12","14","15","16","17","18"],
			    		    datasets: [{ data: [60,75,55,30,15,10,5,3,1,0,0,0,0,0,0,0,0] }]
			    	 }
			     },
				{
			    	 profile_name: 'Red Flag',
			    	 profile_class: 'btn-danger',
			    	 profile_color: redflagColor,
			    	 profile_highlight: redflagHighlight,
			    	 profile_overlay: redflagOverlay,
			    	 profile_scores: getScores(scores, 4),
			    	 profile_probability: 10,
			    	 profile_tenure_data: {
			    		    labels: ["1","2","3","4","5","6","7","8","9","10","11","12","14","15","16","17","18"],
			    		    datasets: [{ data: [80,10,7,3,0,0,0,0,0,0,0,0,0,0,0,0,0] }]
			    	 }
			     }]
		};
	
	return position;
	
}


// Stub Code:
	function dData () {
	  return Math.round(Math.random() * 10) + 1
	};

function getStubDataForRoleBenchmark() {
	
	var person = {
		first_name : 'John',
		cf : {
			0:{"cf_name":"Work Ethic","value":15},
			1:{"cf_name":"Perseverence","value":20},
			2:{"cf_name":"Prior Experience","value":30},
			3:{"cf_name":"Referral","value":40},
			4:{"cf_name":"Commute","value":45},
			5:{"cf_name":"Job History","value":45},
			6:{"cf_name":"Personal Relationship","value":45}
		}
	};
	var role_benchmark = {
		role_name : 'Crew',
		role_description : 'Crew is an entry level position. Required basic work skills and ability to read / speak English.',
		applicant_count : '1300',
		hire_count : '300',
		role_grade : {
			0:{"grade":"A","n0":"tenure","v0":"9.3","n1":"wage_increase","v1":".034"},
			1:{"grade":"B","n0":"tenure","v0":"8.2","n1":"wage_increase","v1":".021"},
			2:{"grade":"C","n0":"tenure","v0":"5.7","n1":"wage_increase","v1":".014"},
			3:{"grade":"D","n0":"tenure","v0":"2.4","n1":"wage_increase","v1":".020"}
		},
		cf : {0:{"cf_name":"Work Ethic","value":15},1:{"cf_name":"Perseverence","value":20},2:{"cf_name":"Prior Experience","value":30},3:{"cf_name":"Referral","value":40},4:{"cf_name":"Commute","value":45},5:{"cf_name":"Job History","value":45},6:{"cf_name":"Personal Relationship","value":45}},
		date : 'Oct 14, 2016'
	};
	return {'person' : person, 'role_benchmark' : role_benchmark };
}





//Payroll tools section
function uploadCSV() {
	$('#csvFile').parse({
		config : {
			header: true,
			dynamicTyping: true,
			complete: function(results, file) {

				$.ajax({
					type: "POST",
					async: true,
				    headers: { 
				        'Accept': 'application/json',
				        'Content-Type': 'application/json'
				    },
				    dataType: 'json',
				    url: "/admin/test",
					data: JSON.stringify(results),
					success: function(data) {console.log(data);}
				});
				
				console.log("Parsing complete:", results, file);
			}
		},
		before : function(file, inputElem){},
		error: function(err, file, inputElem, reason){},
		complete : {}

	})
}

function testIntegrationService(user,pass,data,url) {
	$.ajax({
		type: "POST",
		async: true,
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json',
	        'Authorization': 'Basic ' + btoa(user + ':' + pass)
	    },
	    dataType: 'json',
	    url: "/integration/"+url,
		data: JSON.stringify(data),
		success: function(data) {console.log(data);}
	});
}
//Generic, always useful post form to action

function postJsonData(jsondata, url, callback) {
	$.ajax({
		type: "POST",
		async: true,
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
	    url: url,
		data: JSON.stringify(jsondata),
		success: callback
	});
}

function postToService(data, url, callback) {
	$.ajax({
		type: "POST",
		async: true,
	    url: url,
		data: data,
		success: callback
	});
}


function getPredictionMean(prediction) {
	switch (prediction.model_id) {
		case 1:
			return .48;
			break;
		case 2:
			return .31
			break;
		case 3:
		default:
			return .19;
			break;
		
	}
}
function getPredictionStDev(prediction) {
	switch (prediction.model_id) {
	case 1:
		return .052;
		break;
	case 2:
		return .047;
		break;
	case 3:
	default:
		return .038;
		break;	
}
	
}
