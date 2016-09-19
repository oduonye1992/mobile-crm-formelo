'use strict';
// Alternative to JQuery
var manipulator =  function(){
    var log  = function (e){
        alert(JSON.stringify(e));
    };
    return {
        insert : function(tag, message){
            var selectedTag = document.querySelectorAll(tag);
            selectedTag.innerHTML  = message;
        },
        insertIntoId : function(id, message){
            var selectedTag = document.getElementById(id);
            selectedTag.innerHTML = message;
        },
        insertIntoTag : function(tagname, message){
            var selectedTag =  document.getElementsByTagName(tagname);
            selectedTag.innerHTML = message;
        },
        appendIntoTag : function(tagname, message){
            try{
                var selectedTag =  document.getElementsByTagName(tagname);
                selectedTag[0].innerHTML += message;
            } catch(e){
                log(e);
            }
        },//                manipulator.appendToId('body', html);
        appendToId : function(id, message){
            try{
                var selectedTag =  document.getElementById(id);
                selectedTag.innerHTML += message;
            } catch(e){
                log(e);
            }
        }
    }
}();