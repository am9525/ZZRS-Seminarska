$(document).ready(()=>{
    $.get("http://localhost:5000/manger/testStatus", (response)=>{
        console.log(response);
        if(response.statusTest == true){
            $("#tfStAktSenz").attr("disabled", true);
            $("#btZacTest").attr("disabled", true);
            $("#tfStZapTest").attr("disabled", true);
            $("#izbiraTesta").attr("disabled", true);
            $("#btPostTabelo").attr("disabled", true);
            $("#btUnicTabelo").attr("disabled", true);
            $(".alertText").text("TEST SE ŽE IZVAJA");            
        }
        else{
            $("#tfStAktSenz").attr("disabled", false);
            $("#btZacTest").attr("disabled", false);
            $("#tfStZapTest").attr("disabled", false);
            $("#izbiraTesta").attr("disabled", false);
            $("#btPostTabelo").attr("disabled", false);
            $("#btUnicTabelo").attr("disabled", false);
            $(".alertText").text("TEST SE NE IZVAJA");   
        }
        if(response.statusBaza)
            $("#statusBaza").text("Baza dela");
        else
            $("#statusBaza").text("Baza ne dela"); 
    });
});

setInterval(()=>{
$.get("http://localhost:5000/manger/testStatus", (response)=>{
    console.log(response);
    if(response.statusTest == true){
        $("#tfStAktSenz").attr("disabled", true);
        $("#btZacTest").attr("disabled", true);
        $("#tfStZapTest").attr("disabled", true);
        $("#izbiraTesta").attr("disabled", true);
        $("#btPostTabelo").attr("disabled", true);
        $("#btUnicTabelo").attr("disabled", true);
        $(".alertText").text("TEST SE ŽE IZVAJA");            
    }
    else{
        $("#tfStAktSenz").attr("disabled", false);
        $("#btZacTest").attr("disabled", false);
        $("#tfStZapTest").attr("disabled", false);
        $("#izbiraTesta").attr("disabled", false);
        $("#btPostTabelo").attr("disabled", false);
        $("#btUnicTabelo").attr("disabled", false);
        $(".alertText").text("TEST SE NE IZVAJA");   
    }
    if(response.statusBaza)
        $("#statusBaza").text("Baza dela");
    else
       $("#statusBaza").text("Baza ne dela"); 
});
}, 3000);