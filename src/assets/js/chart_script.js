/*!
 * Chart_script.js
 * Author       : Bestwebcreator.
 * Template Name: Cryptocash – ICO, Cryptocurrency Website & ICO Landing Page HTML + Dashboard Template
 * Version      : 1.6
*/
var config = {
type: 'doughnut',
data: {
 
 datasets: [{
  data: [13.97, 6.12, 12.2, 7.12, 10.59],
  backgroundColor: ['#f69040','#78c596','#f17776','#0eadc9','#5b5da8'],
  borderColor: [
   'rgba(255,255,255,0.5)',
   'rgba(255,255,255,0.5)',
   'rgba(255,255,255,0.5)',
   'rgba(255,255,255,0.5)',
   'rgba(255,255,255,0.5)',
  ],
  borderWidth: 1,
  label: 'Dataset 1'
 }],
 labels: [
  'Marketing & General',
  'Team & Advisors',
  'Pre-ICO Tokens',
  'Platform Integration',
  'Mobile Ad Platform'
 ]
},
options: {
 responsive: true,
 legend: {
   display: false,
 },
 title: {
   display: false,
   text: 'Chart.js Doughnut Chart'
 },
 pieceLabel: {
  render: 'percentage',
  fontColor: ['#f69040','#78c596','#f17776','#0eadc9','#5b5da8'],
  fontSize: 16,
  fontStyle: 'bold',
  position: 'outside',
  precision: 2
 },
 animation: {
   animateScale: true,
   animateRotate: true
 }
}
};

var config2 = {
type: 'doughnut',
data: {
 
 datasets: [{
  data: [28000000,8000000,20000000,30000000,5000000,4000000,5000000],
  backgroundColor: ['#f17776','#0eadc9','#5b5da8','#f69040','#78c596','#a432a8','#329aa8'],
  borderColor: [
   'rgba(255,255,255,0.5)',
   'rgba(255,255,255,0.5)',
   'rgba(255,255,255,0.5)',
   'rgba(255,255,255,0.5)',
   'rgba(255,255,255,0.5)',
  ],
  borderWidth: 1,
  label: 'Dataset 1'
 }],
 labels: [
  'ICO Sale',
  'Dev & Marketing',
  'Team Token',
  'Listing & Liquidity',
  'Air Drop',
  'Operational Management',
  'TRXN Fee Added To Liquidity Pool'
 ]
},
options: {
 responsive: true,
 legend: {
   display: false,
 },
 title: {
   display: false,
   text: 'Chart.js Doughnut Chart'
 },
 pieceLabel: {
  render: 'percentage',
  fontColor: ['#f17776','#0eadc9','#5b5da8','#f69040','#78c596'],
  fontSize: 16,
  fontStyle: 'bold',
  position: 'outside',
  precision: 2
 },
 animation: {
   animateScale: true,
   animateRotate: true
 }
 
}
};


window.onload = function() {
// var ctx = document.getElementById('token_sale').getContext('2d');
// window.myPie = new Chart(ctx, config);
var ctx2 = document.getElementById('token_dist').getContext('2d');
window.myPie = new Chart(ctx2, config2);
};