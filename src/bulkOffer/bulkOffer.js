function fetchBatch(batchID, xrpAddress, seed, xrplNode){
    $.ajax({
        url: "https://api.nftmaster.com/IOUOffer?id="+batchID,
        contentType: "application/json",
        dataType: 'json',
        success: function (result){
            if (result.offers!=null) {
                $("#result").text("Offers found: "+result.offers.length);
                
                signOffers(result.offers, xrpAddress, seed, xrplNode);
            } else {
                $("#result").text("No NFTs found for batch id: "+batchID);
            }
        },
        error: function (){
            $("#result").text("No batch found or an error occured. If you require support email support@nftmaster.com");
        }
    })
}

function checkTxResult(response) {
    let obj = JSON.parse(response);
    return (obj.result.engine_result == "tefPAST_SEQ") ? false : true;
}

async function getCurrentSequence(xrpAddress, client) {
    let account_info = await client.request({
        "command": "account_info",
        "account": xrpAddress,
        "ledger_index": "validated"
    });

    return account_info.result.account_data.Sequence
}

const delay = ms => new Promise(res => setTimeout(res, ms));

function signOffers(offers, xrpAddress, seed, xrplNode) {


    let socket = new WebSocket(xrplNode);
    socket.onopen = async function (e) {
        const my_wallet = xrpl.Wallet.fromSeed(seed)
        const client = new xrpl.Client(xrplNode);
        await client.connect();

        let tempSequence = await getCurrentSequence(my_wallet.address, client);

        for (let i = 0; i < NFTs.length; i++) {

            let txJSON = {
                "TransactionType": "NFTokenCreateOffer",
                "Account": xrpAddress,
                "NFTokenID": offers[i].nfTokenID,
                "Destination": offers[i].destination,
                "Amount": offers[i].amount,
                "Fee": "250",
                "Flags": offers[i].flags,
                "Sequence": tempSequence,
                "Memos": [{
                    "Memo": {
                        "MemoType": offers[i].memoType,
                        "MemoData": offers[i].memoData
                    }
                }]
            }

            let signed = await my_wallet.sign(txJSON);
            let tx = "{\"command\": \"submit\", \"tx_blob\": \"" + signed.tx_blob + "\"}";
            socket.send(tx);


            let failed = false;

            socket.onmessage = (event) => {
                let obj = JSON.parse(event.data);
                console.log(obj);

                switch (obj.result.engine_result) {
                    case "terQUEUED":
                        failed = false;
                        break;
                    case "tesSUCCESS":
                        failed = false;
                        break;
                    default:
                        failed = true;
                        break;
                }
            };

            if (failed) {
                tempSequence = await getCurrentSequence(my_wallet.address, client);
                i -= 1;
            } else {
                let currentNumber = i + 1;
                tempSequence += 1;
                $("#signingProgress").text("Progess: " + currentNumber + "/" + offers.length);
                if (currentNumber == offers.length) {
                    $("#completedSigning").text("🚀 Offers signed! 🚀");
                }
            }

            console.log(failed);

            if(i % 50 === 0){
                await delay(8000);
            }
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