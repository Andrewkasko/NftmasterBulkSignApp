function fetchBatch(batchID, xrpAddress, seed, xrplNode){
    $.ajax({
        url: "https://api.nftmaster.com/IOUOffer?id="+batchID,
        contentType: "application/json",
        dataType: 'json',
        success: function(result){
            
            if(result.offers!=null){
                $("#result").text("Offers found: "+result.offers.length);
                
                signOffers(result.offers, xrpAddress, seed, xrplNode);
            }else{
                $("#result").text("No NFTs found for batch id: "+batchID);
            }
        },
        error: function(){
            $("#result").text("No batch found or an error occured. If you require support email support@nftmaster.com");
        }
    })
}

const delay = ms => new Promise(res => setTimeout(res, ms));

function signOffers(offers, xrpAddress, seed, xrplNode) {
    let socket = new WebSocket(xrplNode);

    socket.onopen = async function (e) {
        for(let i = 0; i<offers.length; i++){

            let jsonText = "{\"command\":\"submit\",\"secret\":\"" + seed + "\",\"tx_json\":{\"TransactionType\":\"NFTokenCreateOffer\",\"Account\":\"" + xrpAddress + "\",\"NFTokenID\":\"" + offers[i].nfTokenID + "\",\"Destination\":\"" + offers[i].destination + "\",\"Amount\":\"" + offers[i].amount + "\",\"Fee\":\""+100+"\",\"Flags\":" + offers[i].flags + ",\"Memos\":[{\"Memo\":{\"MemoType\":\"" + offers[i].memoType + "\",\"MemoData\":\"" + offers[i].memoData + "\"}}]}}";
            
            let currentNumber = i +1;
            $("#signingProgress").text("Progess: "+currentNumber+"/"+offers.length);
            //wait 5 seconds before sending the next request.
            if(currentNumber == offers.length){
                $("#completedSigning").text("🚀 Offers signed! 🚀");
            }
            socket.send(jsonText);
            await delay(5000);
        }
        socket.close();
    };
}


$(document).ready(function() {
    $( "#sign-batch" ).submit(function( event ) {
        var xrplNode = $("#XRPLNode").val();
        var batchID = $("#BatchID").val();
        var xrpAddress = $("#XrpAddress").val();
        var seed = $("#Seed").val();
        fetchBatch(batchID, xrpAddress, seed, xrplNode);
        event.preventDefault();
      });
});