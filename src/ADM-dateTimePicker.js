/* global moment, angular */
String.prototype.toPersianDigits = function(){
    var id= ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return this.replace(/[0-9]/g, function(w){
        return id[+w]
    });
};
String.prototype.toEnglishDigits = function(){
    var id= {'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
    return this.replace(/[^0-9.]/g, function(w){
        return id[w]||w;
    });
};
String.prototype.lZero = function() {
    return (this.length<2 ? '0'+this : this);
};
Array.prototype.toNumber = function() {
    return this.map(function(item) {return Number(item);});
};
Number.prototype.lZero = function() {
    return (this<10 ? '0'+this : this);
};
var module = angular.module('ADM-dateTimePicker', [
    'ADM-dateTimePicker.templates',
    "ngMaterial",
    "ngAnimate",
    "ngAria"
]);