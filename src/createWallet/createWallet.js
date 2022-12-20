async function generateWallet() {
    let newWallet = await xrpl.Wallet.generate();
    $("#walletAddress").text("Address: "+ newWallet.classicAddress);
    $("#walletSeed").text("Seed: "+newWallet.seed);
    $("#fullResponse").text("Full response: " + JSON.stringify(newWallet));
}


$(document).ready(function() {
    $("#generateWallet").click(function(){
        generateWallet();
    });
});