function fetchBatch(batchID, xrpAddress, seed, xrplNode) {
    $.ajax({
        url: "https://api.nftmaster.com/Batch?id=" + batchID,
        contentType: "application/json",
        dataType: 'json',
        success: function (result) {
            console.log(result);
            if (result.nfts != null) {
                $("#result").text("NFTs found: " + result.nfts.length);

                mintNFTs(result.nfts, xrpAddress, seed, xrplNode);
            } else {
                $("#result").text("No NFTs found for batch id: " + batchID);
            }
        },
        error: function () {
            $("#result").text("No batch found or an error occured. If you require support email support@nftmaster.com");
        }
    })
}

function checkTxResult(response) {
    console.log(response);
    let obj = JSON.parse(response);
    let reValue = (obj.result.engine_result == "tefPAST_SEQ") ? false : true;
    console.log("revalue: " + reValue.toString());
    return reValue;
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


async function mintNFTs(NFTs, xrpAddress, seed, xrplNode) {

    let socket = new WebSocket(xrplNode);
    socket.onopen = async function (e) {
        const my_wallet = xrpl.Wallet.fromSeed(seed)
        const client = new xrpl.Client(xrplNode);
        await client.connect();

        let tempSequence = await getCurrentSequence(my_wallet.address, client);

        console.log(tempSequence);
        // console.log(account_info);
        // console.log(account_info.result.account_data.Sequence);
        console.log(my_wallet);



        //var tempSequence =0;

        for (let i = 0; i < NFTs.length; i++) {

            //let jsonText = "{\"command\":\"submit\",\"secret\":\"" + seed + "\",\"tx_json\":{\"TransactionType\":\"NFTokenMint\",\"Account\":\"" + xrpAddress + "\",\"NFTokenTaxon\":" + NFTs[i].taxon + ",\"Flags\":" + NFTs[i].flags + ",\"TransferFee\":" + NFTs[i].transferFee + ",\"Fee\":\""+100+"\", \"URI\":\"" + NFTs[i].uri + "\"}}";

            //let jsonText = "{\"TransactionType\":\"NFTokenMint\",\"Account\":\"" + xrpAddress + "\",\"NFTokenTaxon\":" + NFTs[i].taxon + ",\"Flags\":" + NFTs[i].flags + ",\"TransferFee\":" + NFTs[i].transferFee + ",\"Fee\":\""+100+"\", \"URI\":\"" + NFTs[i].uri + "\"}";

            // let account_info = await client.request({
            //     "command": "account_info",
            //     "account": my_wallet.address,
            //     "ledger_index": "validated"
            // });
            //console.log(account_info);
            console.log(tempSequence);


            let txJSON = {
                "TransactionType": "NFTokenMint",
                "Account": xrpAddress,
                "TransferFee": NFTs[i].transferFee,
                "NFTokenTaxon": NFTs[i].taxon,
                "Flags": NFTs[i].flags,
                "Fee": "250",
                "URI": NFTs[i].uri,
                "Sequence": tempSequence
            }

            //console.log(txJSON);

            let signed = await my_wallet.sign(txJSON);



            console.log(signed);

            //Submit blob
            let tx = "{\"command\": \"submit\", \"tx_blob\": \"" + signed.tx_blob + "\"}";
            console.log(tx);
            socket.send(tx);


            let failed = false;

            socket.onmessage = (event) => {
                //console.log(JSON.stringify(event.data));
                //var txSuccess = checkTxResult(event.data);
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
                $("#mintingProgress").text("Progess: " + currentNumber + "/" + NFTs.length);
                if (currentNumber == NFTs.length) {
                    $("#completedMinting").text("🚀 Minting completed! 🚀");
                }
            }

            console.log(failed);

            if(i % 50 === 0){
                await delay(8000);
            }
            //await delay(5000);

            //Update UI 

            //account_info.result.account_data.Sequence += 1;
        }
        socket.close();
    };
}


$(document).ready(function () {
    $("#mint-batch").submit(function (event) {
        var xrplNode = $("#XRPLNode").val();
        var batchID = $("#BatchID").val();
        var xrpAddress = $("#XrpAddress").val();
        var seed = $("#Seed").val();
        fetchBatch(batchID, xrpAddress, seed, xrplNode);
        event.preventDefault();
    });
});