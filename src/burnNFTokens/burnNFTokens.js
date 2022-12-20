function burnNFT(NFTs, xrpAddress, seed, xrplNode) {
    let socket = new WebSocket(xrplNode);
    socket.onopen = async function (e) {
        for (let i = 0; i < NFTs.length; i++) {
            let jsonText = "{\"command\":\"submit\",\"secret\":\"" + seed + "\",\"tx_json\":{\"TransactionType\":\"NFTokenBurn\",\"Account\":\"" + xrpAddress + "\",\"NFTokenID\":\"" + NFTs[i].NFTokenID + "\"}}";

            let currentNumber = i + 1;
            $("#signingProgress").text("Progess: " + currentNumber + "/" + NFTs.length);
            //wait 5 seconds before sending the next request.
            if (currentNumber == NFTs.length) {
                $("#completedSigning").text("Burn completed!");
            }
            socket.send(jsonText);
            await delay(1000);
        }
        socket.close();
    };
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchNfts(xrpAddress, seed, xrplNode) {

    const client = new xrpl.Client(xrplNode)
    await client.connect()

    console.log(client);
    const response = await client.request({
        "command": "account_nfts",
        "account": xrpAddress,
        "ledger_index": "validated",
        "limit": 400
    });

    let NFTs = response.result.account_nfts;
    console.log(NFTs)
    burnNFT(NFTs, xrpAddress, seed, xrplNode);
}


$(document).ready(function () {
    $("#sign-batch").submit(function (event) {
        var xrplNode = $("#XRPLNode").val();
        var xrpAddress = $("#XrpAddress").val();
        var seed = $("#Seed").val();
        fetchNfts(xrpAddress, seed, xrplNode);

        event.preventDefault();
    });
});