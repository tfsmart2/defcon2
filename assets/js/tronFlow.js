let currentAccount;
let lastTransactionTime;
let invested;
let lastTrans = null;
let amountuser;
let statstotalprof;

let siteLoading = true;
let connected = false;
const defaultSponsor = 'TGiyNohpFQcCauqqaePLtH8JSop3jBeRFn';
let contractAddress = 'TFrBVjdpsuWQUMtjFpMxhUKg2q3oa6rgGv';
let serverUrl = 'https://arcane-spire-90140.herokuapp.com/';
let tronScan = 'https://tronscan.org/#/transaction/';

function startInterval(seconds, callback) {
  callback();
  return setInterval(callback, seconds * 1000);
}

function getDataFromServer() {
  let url = `${serverUrl}api/events/today`;
  if (currentAccount) {
        
    const currentUser = '0x' + tronWeb.address.toHex(currentAccount).substr(2);
    url = `${serverUrl}api/events/today?userAddress=${currentUser}`;
  }
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (window.tronWeb) {
        if (data.user) {
          let amount = tronWeb.fromSun(data.user.amount);
          amountuser = amount;
          $('#deposits').text(amount);
     //   let  globaldepamount = $('#deposits').val();
      //      if (parseInt(amount) > 0) { 
             // $('#aff4').text(globaldepamount);
      //       $('#aff4').text(amount);
        //    }
          
          
         
        } else {
          $('#deposits').text(0);
          
        }
        data.topFiveTrans.forEach((trans, i) => {
          let amount = tronWeb.fromSun(trans.result.amount);
          $(`#today-${i}`).removeClass('d-none');
          $(`#today-${i}-amount`).text(parseFloat(amount).toFixed(2) + ' TRX');
          $(`#today-${i}-address`).val(
            tronWeb.address.fromHex(trans.result.user)
          );
          $(`#today-${i}-link`).attr(
            'href',
            `${tronScan}${trans.transaction_id}`
          );
        });

        data.lastFiveTrans.forEach((trans, i) => {
          let amount = tronWeb.fromSun(trans.result.amount);
          if (i == 0) {
            if (lastTrans && lastTrans != trans._id) {
              newTransaction(amount);
              lastTrans = trans._id;
            } else {
              lastTrans = trans._id;
            }
          }
          $(`#last-${i}`).removeClass('d-none');
          $(`#last-${i}-amount`).text(parseFloat(amount).toFixed(2) + ' TRX');
          $(`#last-${i}-address`).val(
            tronWeb.address.fromHex(trans.result.user)
          );
          $(`#last-${i}-link`).attr(
            'href',
            `${tronScan}${trans.transaction_id}`
          );
        });
      }
    });
}

startInterval(30, getDataFromServer);

function getLastDayTopDeposits() {
  fetch(`${serverUrl}api/events/last-day`)
    .then((response) => response.json())
    .then((data) => {
      data.forEach((trans, i) => {
        if (window.tronWeb) {
          let amount = tronWeb.fromSun(trans.result.amount);
          $(`#last-day-${i}`).removeClass('d-none');
          $(`#last-day-${i}-amount`).text(
            parseFloat(amount).toFixed(2) + ' TRX'
          );
          $(`#last-day-${i}-address`).val(
            tronWeb.address.fromHex(trans.result.user)
          );
          $(`#last-day-${i}-link`).attr(
            'href',
            `${tronScan}${trans.transaction_id}`
          );
        }
      });
    });
}
getLastDayTopDeposits();

window.addEventListener('message', (e) => {
  if (e.data?.message?.action == 'tabReply') {
    console.warn('tabReply event', e.data.message);
    if (e.data?.message?.data?.data?.node?.chain == '_') {
      console.info('tronLink currently selects the main chain');
    } else {
      console.info('tronLink currently selects the side chain');
    }
  } else if (e.data?.message?.action == 'setAccount') {
    //showPopup('Account Changed', 'success');
    console.warn('setAccount event', e.data.message);
    console.info('current address:', e.data.message.data.address);
  } else if (e.data?.message?.action == 'setNode') {
    console.warn('setNode event', e.data.message);
    if (e.data?.message?.data?.data?.node?.chain == '_') {
      console.info('tronLink currently selects the main chain');
    } else {
      console.info('tronLink currently selects the side chain');
    }
  }
});

/**
 *
 */
$(document).ready(async () => {
  const url = new URL(window.location);
  const params = new URLSearchParams(url.search);
  if (window.location.hostname == '127.0.0.1' || params.has('testing')) {
    contractAddress = 'TRktZxNpTmbFEchoQtj8U5fpk9Xn42ZnkQ';
  }
  const contractData = async () => {
    if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
      // clearInterval(checkConnectivity);
      if (!connected) {
        showPopup('Connected to Tron LINK.', 'success');
        connected = true;
      }

      const tronWeb = window.tronWeb;
      currentAccount = tronWeb.defaultAddress.base58;
      $('#address').text(currentAccount);

      const contract = await tronWeb.contract().at(contractAddress);

      getTotalInvested(contract);
      getTotalInvestors(contract);
      getContractBalanceRate(contract);
      getuserstats(contract);
      invested = await getDeposit(contract);
      let profit, totalProfit, halfProfit;

      if (parseInt(invested) > 0) {
        profit = await getProfit(contract);

        totalProfit = (profit.toNumber() / 1000000).toFixed(6);
        halfProfit = (profit.toNumber() / 2000000).toFixed(6);
        statstotalprof = (profit.toNumber() / 1000000).toFixed(6);
        $('#statstotalprof').text(statstotalprof);
        

        $('#refererAddress').val('You Already have a Sponsor');
        $('#refererAddress').prop('disabled', true);

        $('#accountRef').val(
          window.location.hostname + '?ref=' + currentAccount
        );
      } else {
        if (params.has('ref')) {
          $('#refererAddress').prop('disabled', true);
          $('#refererAddress').val(params.get('ref'));
        } else if ($('#refererAddress').val() == 'You Already have a Sponsor') {
          $('#refererAddress').prop('disabled', false);
          $('#refererAddress').val('');
        }
        $('#accountRef').val(
          'You need to invest at least 50 TRX to activate the referral link.'
        );
        invested = totalProfit = halfProfit = 0;
      }

      if (siteLoading) {
        siteLoading = false;
        runCounter('#actualCapital', invested);
        runCounter('#withdrawableAmount', halfProfit);
        runCounter('#withdrawableInterest', halfProfit);
        runCounter('#totalWithdrawable', totalProfit);
      } else {
        $('#actualCapital').val(invested);
        
        $('#withdrawableAmount').val(halfProfit);
        $('#withdrawableInterest').val(halfProfit);
        $('#totalWithdrawable').val(totalProfit);
        
        
      }
      $('.deduction').text(halfProfit);
      $('#invested').text(totalProfit);
      $('#withdrawal').text((halfProfit / 2).toFixed(6));

      $('#reinvest-new-balance').text(
        parseFloat(
          parseFloat($('#actualCapital').val()) + parseFloat(halfProfit)
        ).toFixed(6)
      );
      $('#withdrawal-new-balance').text(
        parseFloat(
          parseFloat($('#actualCapital').val()) - parseFloat(halfProfit)
        ).toFixed(6)
      );
      getBalanceOfAccount();
      getBalanceOfContract()
    } else {
      if (connected) {
        showPopup('Tron LINK is disconnected.', 'error');
        connected = false;
      }
    }
  };
  startInterval(4, contractData);
});
//----------------//
async function getBalanceOfAccount() {
  return tronWeb.trx.getBalance(currentAccount).then((res) => {
    const balance = parseInt(res / 1000000);
    if (balance) {
      $('#balance').text(balance);
    } else {
      $('#balance').text(0);
    }
    return balance;
  });
}
async function getBalanceOfContract() {
  return tronWeb.trx.getBalance(contractAddress).then((res) => {
    const contbalance = parseInt(res / 1000000);
    if (contbalance) {
      $('#contbalance').text(thousandsSeparators(contbalance));
    } else {
      $('#contbalance').text(0);
    }
    return contbalance;
  });
}      
      

async function deposit() {
  let address = $('#refererAddress').val();
  let amount = $('#depositAmount').val();
  const contract = await tronWeb.contract().at(contractAddress);
  if (!tronWeb.isAddress(address) && parseInt(invested) < 1) {
    showPopup('Please Enter Right Address', 'error');
  } else if (amount < 50) {
    showPopup('Minimum Amount is 50 TRX', 'error');
  } else if (amount > (await getBalanceOfAccount())) {
    showPopup('Insufficient Balance', 'error');
  } else if ((await getBalanceOfAccount()) - amount < 20) {
    showPopup('You need a few(15-20) TRX in your wallet to make an transaction', 'error');
  } else {
    if (parseInt(invested) > 0) {
      address = defaultSponsor;
    }
    if (window.tronWeb) {
      let contract = await tronWeb.contract().at(contractAddress);
      contract
        .deposit(address)
        .send({
          callValue: tronWeb.toSun(amount),
        })
        .then((output) => {
          console.info('Hash ID:', output, '\n');
          // newTransaction(amount);
          getLastFiveDeposits();
          getTodayTopDeposits();
          // showPopup('Deposit Successful', 'success');
        });
    } else {
      showPopup('TronWeb is not Connected', 'error');
    }
  }
}
//withDraw your fund!
async function withdraw() {
  if (window.tronWeb) {
    let contract = await tronWeb.contract().at(contractAddress);
    await contract
      .withdraw()
      .send()
      .then((output) => {
        getBalanceOfAccount();
        console.info('HashId:' + ' ' + output);
        showPopup('Withdraw Successful', 'success');
      });
  } else {
    showPopup('TronWeb is not Connected', 'error');
  }
}
//reinvest your fund!
async function reinvest() {
  if (window.tronWeb) {
    let contract = await tronWeb.contract().at(contractAddress);
    await contract
      .reinvest()
      .send()
      .then((output) => {
        console.info('HashId:' + ' ' + output);
        showPopup('Reinvest Successful', 'success');
      });
  } else {
    showPopup('TronWeb is not Connected', 'error');
  }
}

/**
 * get total Invested
 * @param {*} contract
 */
async function getTotalInvested(contract) {
  let totalInvested = await contract.totalInvested().call();
  $('#totalInvested').text(
    thousandsSeparators(parseInt(totalInvested.toNumber() / 1000000))
  );
}

/**
 * get total Investors
 * @param {*} contract
 */
async function getTotalInvestors(contract) {
  let totalInvestors = await contract.totalPlayers().call();
  $('#totalInvestors').text(
    thousandsSeparators(totalInvestors.toNumber())
                       );
}

/**
 * get Contract Balance Rate
 * @param {*} contract
 */
async function getContractBalanceRate(contract) {
  let contractbalanceRate = await contract.getContractBalanceRate().call();
  $('#roi').text((contractbalanceRate.toNumber() / 10 + 1).toFixed(1));
}

/**
 * get user stats
 * @param {*} contract
 */
async function getuserstats(contract){
  
let invester = await contract.players(currentAccount).call();
  $('#address2').text(currentAccount);
  const userpayout = invester.payoutSum.toNumber() / 1000000;
    $('#userpayout').text(userpayout.toFixed(2));
  const sponsoraddress1 = invester.affFrom;
  const sponsoraddress= tronWeb.address.fromHex(sponsoraddress1);
 // hex_address = tronWeb.address.toHex(address);
  if (sponsoraddress == 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'){
  $('#sponsoraddress').text("You have no Sponsor");
  }else{
    $('#sponsoraddress').text(sponsoraddress);
  }
  const refrewards = invester.affRewards.toNumber() / 1000000;
    const aff1 = invester.aff1sum.toNumber();
    const aff2 = invester.aff2sum.toNumber();
    const aff3 = invester.aff3sum.toNumber();
    const aff4 = invester.aff4sum.toNumber();
    $('#refrewards').text(refrewards.toFixed(2));
    $('#aff1').text(aff1);
    $('#aff2').text(aff2);
    $('#aff3').text(aff3);
    $('#aff4').text(aff4);
  $('#statsactivecap').text(invested);

  
  $('#statsreinvest').text(Math.abs(
    parseFloat(
        parseFloat(
          parseFloat(invested) - parseFloat(amountuser) - parseFloat($('#refrewards').text()) + parseFloat($('#userpayout').text() / 4)
        ) * 2)).toFixed(1)
      ); 
  
 
  
  $('#statsinaccap').text(
    parseFloat(
      parseFloat($('#statsreinvest').text() / 2) + parseFloat($('#userpayout').text() / 2)
      )
    );
  $('#statstotalcap').text(
    parseFloat(
      parseFloat($('#statsinaccap').text()) + parseFloat(invested)
      )
    );
  $('#statsciwith').text(
    parseFloat(
      parseFloat($('#statsreinvest').text()) + parseFloat($('#userpayout').text())
      )
    );
  
  $('#statscigenerated').text(
    parseFloat(
        parseFloat($('#statsreinvest').text()) + parseFloat($('#userpayout').text()) + parseFloat(statstotalprof)
        ).toFixed(2)
      );
  
  $('#statstotaldouble').text(
    parseFloat(
        parseFloat(
          parseFloat($('#statsinaccap').text()) + parseFloat(invested)
        ) * 2).toFixed(2)
      ); 
  




}



/**
 * get Deposit
 * @param {*} contract
 */
async function getDeposit(contract) {
  let invester = await contract.players(currentAccount).call();
  const deposit = invester.trxDeposit.toNumber() / 1000000;
  return deposit.toFixed(6);
}

/**
 *
 * @param {*} contract
 */
async function getProfit(contract) {
  return await contract.getProfit(currentAccount).call();
}

copy = () => {
  /* Get the text field */
  var copyText = document.getElementById('accountRef');

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /*For mobile devices*/

  /* Copy the text inside the text field */
  document.execCommand('copy');

  showPopup('Copied', 'success');
};

thousandsSeparators = (num) => {
  var num_parts = num.toString().split('.');
  num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return num_parts.join('.');
};

showPopup = (msg, type) => {
  $(`#popup-${type}-msg`).html(msg);

  $('.popup').removeClass('show');

  $(`.${type}-popover`).addClass('show');
  window.setTimeout(() => {
    $(`.${type}-popover`).removeClass('show');
  }, 3 * 1000);
};

runCounter = (id, value) => {
  $({ Counter: 0 }).animate(
    {
      Counter: value,
    },
    {
      duration: 1000,
      easing: 'swing',
      step: function (now) {
        $(id).val(now.toFixed(6));
      },
    }
  );
};

newTransaction = (amount) => {
  $(`#custom-popover-msg`).html(amount + ' TRX Deposited');

  $('.custom-popover').addClass('custom-popover-active');
  window.setTimeout(() => {
    $('.custom-popover').removeClass('custom-popover-active');
  }, 3000);
};
