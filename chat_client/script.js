  
var conversation = undefined;
var query = undefined;
var conv_query = undefined;
var messages_query = {};
var metadata = {};

var client = new layer.Client({
    appId: "layer:///apps/staging/e9fa7cf0-e428-11e5-bd3c-a952f30d69c0"
});


var conversation = client.createConversation({
    participants: ['5819256595808256'],
    distinct: true
});


conversation.setMetadataProperties({
    started_by: {
        userName: 'Test User',
        userId: '12345',
        
    },
    user_state: {
    	obj_name : 'Weirdass Dress 2',
    	obj_image: "http://res.wooplr.com/image/upload/w_1200/p/c/Forever21/2000141572_BLACK/CREAM__2",
    	obj_url: "http://www.wooplr.com/product/forever-21/4788672332824576/button-front-floral-skirt",
    	ts:"Fri Apr 25 2016 15:38:07 GMT+0530 (IST)"
    }
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

function getIdentityToken(nonce, callback){
    $.ajax({
        type: 'POST',
        url: 'http://localhost:5000/identity_token',
        crossDomain: true,
        data: {'user_id':'12345', 'nonce':nonce},
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
		render_chat_ui(conversation.id);
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

// function render_conversations(convs){
// 	$("#chat-sidebar").empty();
// 	$.each(convs, function(i, conv){
// 		console.log(conv);
// 		item = '<span class="chat-conv-item" data-conv-id="'+conv.id+'"> <img src="http://woopler100.appspot.com/image?type=showImage&imageType=small&entityType=USER&entityId='+conv.__metadata.started_by.userId+'" width="24px" class="chat-dp"> '+ conv.__metadata.started_by.userName + '<span class="chat-indicator">'+ conv.unreadCount +'</span> </span>';
// 		$("#chat-sidebar").append(item);
// 	});
// }

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
			
			if (mesgs.data[i].sender.userId == '12345'){
				$('.chat-area').append('<span class="bubble-container"><span class="my-bubble"><span class="chat-email">[Me At '+ sanitize_time(mesgs.data[i]['sentAt']).trim() +']</span>' + mesgs.data[i].parts[0].body +'</span></span>');

			}else{
				$('.chat-area').append('<span class="bubble-container"><span class="their-bubble"><span class="chat-email">[Wooplr Stylist At '+ sanitize_time(mesgs.data[i]['sentAt']).trim() +']</span>' + mesgs.data[i].parts[0].body +'</span></span>');	
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

	window.messages_query[convid] = client.createQuery({
							    model: layer.Query.Message,
							    predicate: 'conversation.id = \'' + convid + '\'',
							    dataType: 'object',
							    sortBy: [{'lastMessage.sentAt': ''}]
							});
	window.messages_query[convid].on('change', function(evt) {

	    if (window.messages_query[convid].data.length) {
	    	render_received_messages(window.messages_query[convid]);
	    	var m = client.getMessage(window.messages_query[convid].data[0].id);

	        m.on('messages:read', function() {
	            console.log('The first message has been read!');
	        });
	    }
	});
	// randors the conversation box
	randor_chat_box(convid);

	//randors the coversation metadata
    // randor_chat_metadata(convid);

    var typingListener = client.createTypingListener(document.getElementById('send_chat'));
	typingListener.setConversation(conversation);
}

function randor_chat_box(convid){

	$("#chat-boxes-area").empty();
	var chat_container = '<div class="chat-box" data-conv-started-by="'+ conversation.__metadata.started_by.userName +'" data-conv-id="'+conversation+'" style="">\
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
	conversation.setMetadataProperties({
	    started_by: {
	        userName: $("input[name='userName']").val(),
	        userId: $("input[name='userId']").val()+'',
	        
	    },
	    user_state: {
	    	obj_name : $("input[name='obj_name']").val(),
	    	obj_image: $("input[name='obj_image']").val(),
	    	obj_url: $("input[name='obj_url']").val(),
	    	ts: new Date()
	    }
	});
}

function if_metadata_changed(old_meta, new_meta){
	$.each(old_meta, function(k, v){
		if(old_meta[k] != new_meta[k]){
			return false;
		} 
	});
	return true;
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