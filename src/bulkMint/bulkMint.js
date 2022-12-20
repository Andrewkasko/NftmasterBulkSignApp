function fetchBatch(batchID, xrpAddress, seed, xrplNode, issuer) {
    $.ajax({
        url: "https://api.nftmaster.com/Batch?id=" + batchID,
        contentType: "application/json",
        dataType: 'json',
        success: function (result) {
            if (result.nfts != null) {
                $("#result").text("NFTs found: " + result.nfts.length);

                mintNFTs(result.nfts, xrpAddress, seed, xrplNode, issuer);
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


async function mintNFTs(NFTs, xrpAddress, seed, xrplNode, issuer) {

    let socket = new WebSocket(xrplNode);
    socket.onopen = async function (e) {
        const my_wallet = xrpl.Wallet.fromSeed(seed)
        const client = new xrpl.Client(xrplNode);
        await client.connect();

        let tempSequence = await getCurrentSequence(my_wallet.address, client);

        for (let i = 0; i < NFTs.length; i++) {

            console.log(tempSequence);

            let txJSON = {};

            if (!issuer) {
                txJSON = {
                    "TransactionType": "NFTokenMint",
                    "Account": xrpAddress,
                    "TransferFee": NFTs[i].transferFee,
                    "NFTokenTaxon": NFTs[i].taxon,
                    "Flags": NFTs[i].flags,
                    "Fee": "250",
                    "URI": NFTs[i].uri,
                    "Sequence": tempSequence
                }
            }else{
                txJSON = {
                    "TransactionType": "NFTokenMint",
                    "Issuer": issuer,
                    "Account": xrpAddress,
                    "TransferFee": NFTs[i].transferFee,
                    "NFTokenTaxon": NFTs[i].taxon,
                    "Flags": NFTs[i].flags,
                    "Fee": "250",
                    "URI": NFTs[i].uri,
                    "Sequence": tempSequence
                }

            }

            console.log(txJSON);

            let signed = await my_wallet.sign(txJSON);
            console.log(signed);
            let tx = "{\"command\": \"submit\", \"tx_blob\": \"" + signed.tx_blob + "\"}";
            console.log(tx);
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
                $("#mintingProgress").text("Progess: " + currentNumber + "/" + NFTs.length);
                if (currentNumber == NFTs.length) {
                    $("#completedMinting").text("🚀 Minting completed! 🚀");
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


$(document).ready(function () {
    $("#mint-batch").submit(function (event) {
        var xrplNode = $("#XRPLNode").val();
        var batchID = $("#BatchID").val();
        var xrpAddress = $("#XrpAddress").val();
        var issuer = $("#Issuer").val();
        var seed = $("#Seed").val();
        fetchBatch(batchID, xrpAddress, seed, xrplNode, issuer);
        event.preventDefault();
    });
});