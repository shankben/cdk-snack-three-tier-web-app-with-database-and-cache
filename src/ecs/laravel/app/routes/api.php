<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Redis;
Use App\Models\User;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::get('user', function (Request $request) {
    return User::all();
    // return $request->user();
});


Route::get('set-user-cache', function (Request $request) {
    return Redis::set($request['key'], $request['value']);
    // return $request->user();
});

Route::get('user-cache', function (Request $request) {
    return Redis::get($request['key']);
    // return $request->user();
});


Route::get('user/{id}', function (Request $request) {
    return User::find($request->id);
    // return $request->user();
});


Route::get('new-user', function(Request $request) {
    return User::create([
        'name' => $request['name'],
        'email' => $request['email'],
        'password' => $request['password'],
    ]);
});


Route::get('env', function(Request $request) {
    return $_ENV;
});


Route::get('db', function(Request $request) {
    return env('DB_USERNAME');
});



?>
