<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckoutController extends Controller
{


    public function process(Request $request)
    {
        $data = $request->all();

        // $transaction = Transaction::create([
        //     'user_id' => Auth::user()->id,
        //     'product_id' => $data['product_id'],
        //     'price' => $data['price'],
        //     'status' => 'pending',
        // ]);

        // Set your Merchant Server Key
        \Midtrans\Config::$serverKey = config('midtrans.serverKey');
        // Set to Development/Sandbox Environment (default). Set to true for Production Environment (accept real transaction).
        \Midtrans\Config::$isProduction = false;
        // Set sanitization on (default)
        \Midtrans\Config::$isSanitized = true;
        // Set 3DS transaction for credit card to true
        \Midtrans\Config::$is3ds = true;

        $params = array(
            'transaction_details' => array(
                'order_id' => rand(),
                'gross_amount' => 10000,
            ),
            'customer_details' => array(
                'first_name' => "Name",
                'email' => "email@example.com",
            ),
        );

        $snapToken = \Midtrans\Snap::getSnapToken($params);

        // return redirect()->route('checkout', $transaction->id);
    }

    // public function checkout(Transaction $transaction)
    // {
    //     $products = config('products');
    //     $product = collect($products)->firstWhere('id', $transaction->product_id);

    //     return view('checkout',  compact('transaction', 'product'));
    // }
}