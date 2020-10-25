const express = require('express');
const router = express.Router();
const {database} = require('../ config/helper');
const crypto = require('crypto');

// GET ALL ORDERS
router.get('/', function (req, res)  {
    database.table('orders_details as od')
        .join([
            {
                table: 'orders as o',
                on: 'o.id = od.order_id'
            },
            {
                table: 'products as p',
                on: 'p.id = od.product_id'
            },
            {
                table: 'users as u',
                on: 'u.id = o.user_id'
            }
        ])
        .withFields(['o.id', 'p.title', 'p.description', 'p.price', 'u.username'])
        .sort({ id: 1})
        .getAll()
        .then(orders => {
            if (orders.length > 0) {
                res.json(orders);
            } else {
                res.json({message: "No orders found"});
            }

        }).catch(err => res.json(err));

});

/* get single order*/
router.get('/:id', function (req,res)  {
    const order_id = req.params.id;
    console.log(order_id);
    database.table('orders_details as od')
        .join([
            {
                table: 'orders as o',
                on: 'o.id = od.order_id'
            },
            {
                table: 'products as p',
                on: 'p.id = od.product_id'
            },
            {
                table: 'users as u',
                on: 'u.id = o.user_id'
            }
        ])
        .withFields(['o.id', 'p.title', 'p.description', 'p.price', 'p.image', 'od.quantity as quantityOrdered'])
        .filter({'od.order_id': order_id})
        .getAll()
        .then(orders => {
            console.log(orders);
            if (orders.length > 0) {
                res.json(orders);
            } else {
                res.json({message: `No orders found with orderID ${order_id}`});
            }

        }).catch(err => res.json(err));
});
/* place a new orders*/

router.post('/new', function (req, res)  {
    // let userId = req.body.userId;
    // let data = JSON.parse(req.body);
    console.log('req.body',req.body)
    let {user_id, products} = req.body;
    console.log('user_id',user_id);
    console.log(products);
   // res.json({user_id});

    if (user_id !== null && user_id > 0) {
        database.table('orders')
            .insert({
                user_id: user_id
            }).then((newOrderId) => {

            if (newOrderId > 0) {
                products.forEach(async (p) => {

                    let data = await database.table('products').filter({id: p.id}).withFields(['quantity']).get();



                    let inCart = parseInt(p.incart);

                    // Deduct the number of pieces ordered from the quantity in database

                    if (data.quantity > 0) {
                        data.quantity = data.quantity - inCart;

                        if (data.quantity < 0) {
                            data.quantity = 0;
                        }

                    } else {
                        data.quantity = 0;
                    }

                    // Insert order details w.r.t the newly created order Id
                    database.table('orders_details')
                        .insert({
                            order_id: newOrderId,
                            product_id: p.id,
                            quantity: inCart
                        }).then(newId => {
                        database.table('products')
                            .filter({id: p.id})
                            .update({
                                quantity: data.quantity
                            }).then(successNum => {
                        }).catch(err => console.log('erreur' , err));
                    }).catch(err => console.log('erreur2' ,err));
                });

            } else {
                res.json({message: 'New order failed while adding order details', success: false});
            }
            res.json({
                message: `Order successfully placed with order id ${newOrderId}`,
                success: true,
                order_id: newOrderId,
                products: products
            })
        }).catch(err => res.json(err));
    }

    else {
        res.json({message: 'New order failed', success: false});
    }

});

/* fake payment gateway call*/
router.post('/payment',function (req,res){

    setTimeout(()=>{
        res.status(200).json({success:true});
    },3000)

})

module.exports = router;
