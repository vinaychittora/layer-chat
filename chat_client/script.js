  
var conversation = undefined;
var query = undefined;
var conv_query = undefined;
var messages_query = undefined;
var metadata = {};
var client = undefined;


function getIdentityToken(nonce, callback){
    $.ajax({
        type: 'POST',
        url: 'http://localhost:8080/identity_token',
        crossDomain: true,
        data: {'user_id':$("input[name='userId']").val(), 'nonce':nonce},
        dataType: 'json',
        success: function(responseData, textStatus, jqXHR) {
            callback(responseData.identity_token);
            render_chat_ui(conversation.id);	

        },
        error: function (responseData, textStatus, errorThrown) {
            alert('Layer SDK init failed.');
        }
    });  
    
}

function renderMyUI(c){
	conv_query  = client.createQuery({
	    model: layer.Query.Conversation,
	    sortBy: [{'lastMessage.sentAt': 'desc'}],
	});

	conv_query.on('change', function(evt) {
		console.log("Conversation changed");
		conv_obj = {}
		$.each(conv_query.data, function(i, c){
			if (c.id.search('temp_layer') == -1){
				conversation = c;
			}	
		});
	    
	});

	client.on('typing-indicator-change', function(evt) {
    if (evt.conversationId === conversation.id) {
		$.each(evt.typing, function(i, u){
			curator = if_curator_data_return(u);
	    	if(curator == ''){
	    		curator = {};
	    		curator['emailId'] = u;
	    	}else{
	    		curator = curator[0];
	    	}
			if(!$('.ti-for-'+u).attr('class')){
				$(".chat-box .typing-signal").append('<div class="ti-for-'+u+'"><img src="http://localhost:8000/curation-dashboard/dist/images/msag.gif" width="50"/>'+u+' is typing</div>');
			}
		});
    	$.each(evt.paused, function(i, u){
			$(".ti-for-"+u).remove();
		});
    }
 });
}


function render_received_messages(mesgs){
	$('.chat-area').html("");
	var msg_date = "";
	if (mesgs.data){
		for (i=mesgs.data.length-1; i>=0; i--){
			curator = if_curator_data_return(mesgs.data[i].sender.userId)
			if (!curator.length){
				curator = {};
				curator['emailId'] = $(".chat-box").data("conv-started-by");
			}else{
				curator = curator[0];
			}
			if (mesgs.data[i]['sentAt'].toDateString() != msg_date){
				msg_date = mesgs.data[i]['sentAt'].toDateString();
				$('.chat-area').append('<ul><li class="chat-ts"><abbr>'+msg_date+'</abbr></li></ul>');
			}
			
			if (mesgs.data[i].sender.userId == $("input[name='userId']").val()){
				$('.chat-area').append('<span class="bubble-container"><span class="my-bubble"><span class="chat-email">[Me At '+ sanitize_time(mesgs.data[i]['sentAt']).trim() +']</span>' + urlify(mesgs.data[i].parts[0].body) +'</span></span>');

			}else{
				$('.chat-area').append('<span class="bubble-container"><span class="their-bubble"><span class="chat-email">[Wooplr Stylist At '+ sanitize_time(mesgs.data[i]['sentAt']).trim() +']</span>' + urlify(mesgs.data[i].parts[0].body) +'</span></span>');	
				their_msg = client.getMessage(mesgs.data[i].id);
				their_msg.isRead = true;
				their_msg.isUnread = false;
			}
		}
	}
	chat_area_obj=document.getElementsByClassName('chat-area');
	chat_area_obj[0].scrollTop = chat_area_obj[0].scrollHeight;
}




function send_msg(txt){
	var messagePart = new layer.MessagePart({
	    mimeType: 'text/plain',
	    body: txt
	});
	$('.chat-area').append('<span class="bubble-container"><span class="my-bubble">'+ 'I says: ' + txt +'</span></span>');
	tmp_msg = conversation.createMessage({ parts: [messagePart] }).send();
}

function render_chat_ui(convid){

	console.log(convid);

	messages_query = client.createQuery({
							    model: layer.Query.Message,
							    predicate: 'conversation.id = \'' + convid + '\'',
							    dataType: 'object',
							    sortBy: [{'lastMessage.sentAt': ''}]
							});
	messages_query.on('change', function(evt) {

	    if (messages_query.data.length) {
	    	render_received_messages(messages_query);
	    	var m = client.getMessage(messages_query.data[0].id);

	        m.on('messages:read', function() {
	            console.log('The first message has been read!');
	        });
	    }
	});
	// randors the conversation box
	randor_chat_box(convid);
	render_received_messages(messages_query);
	

    var typingListener = client.createTypingListener(document.getElementById('send_chat'));
	typingListener.setConversation(conversation);
}

function randor_chat_box(convid){

	$("#chat-boxes-area").empty();
	var chat_container = '<div class="chat-box" data-conv-started-by="'+ conversation.__metadata.started_by.userName +'" data-conv-id="'+convid+'" style="">\
                        <div class="header" style="">\
                          Conversation with <b>'+ conversation.__metadata.started_by.userName +'</b>\
                        </div>\
                        <div class="chat-area"  style="">\
                        </div>\
                        <span class="typing-signal"></span>\
                        <input type="text" width="100%" name="chat" style="width:100%" id="send_chat" />\
                    </div>';
	
    $("#chat-boxes-area").append(chat_container);

}



function sanitize_time(time_str){
	return time_str.toTimeString().split('GMT')[0]
}


function if_curator_data_return(userid){
	var result = ""
	//result = $.grep(CURATORS_LIST, function(e){ return e._id+'' == userid+''; });
	
	return result;
}

function set_metadata(){

	client = new layer.Client({
    	appId: "layer:///apps/staging/e9fa7cf0-e428-11e5-bd3c-a952f30d69c0"
	});



	client.on('challenge', function(evt) {
	    // evt has properties `evt.nonce` and `evt.callback`.
	    getIdentityToken(evt.nonce, function(identityToken) {
	        /*
	         * 3. Submit identity token to Layer for validation
	         */
	        evt.callback(identityToken);
	    })
	});

	client.on('ready', function() {
	    renderMyUI(client);
	});

	client.on('deauthenticated', function() {
	     alert("You have been logged out of the chat");
	});
	
	conversation = client.createConversation({
	    participants: ['1000000001'],
	    distinct: true
	});


	conversation.setMetadataProperties({
	    started_by: {
	        userName: $("input[name='userName']").val(),
	        userId: $("input[name='userId']").val(),
	        
	    },
	    user_state: {
	    	obj_name : $("input[name='obj_name']").val(),
	    	obj_image: $("input[name='obj_image']").val(),
	    	obj_url: $("input[name='obj_url']").val(),
	    	ts:new Date()
	    }
	});

	render_chat_ui(conversation.id);

	
}


function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a target="_blank" href="' + url + '">' + url + '</a>';
    });
}

$(document).ready(function(){
	$('body').on('keypress', '#send_chat', function (event) {
		  if ( event.which == 13 && $(this).val()!='') {
		     event.preventDefault();
		     send_msg($(this).val());
		     $(this).val("");
		  }

	});
	
	$('body').on('click', '#set_metadata', function (event) {
		  set_metadata();

	});

	
});