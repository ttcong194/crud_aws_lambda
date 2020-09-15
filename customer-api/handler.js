const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const { v4: uuidv4 } = require('uuid');

const customerTable = process.env.CUSTOMER_TABLE;
// Create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}
function sortByDate(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1;
  } else return 1;
}
function checkPhone(input)
{
  var phoneno = /^\d{10}$/;
  if (input.match(phoneno)){
      return true;
        }
      else{
        return false;
        }
}

// Create a customer
module.exports.createCustomer = (event, context, callback) => {
  const reqBody = JSON.parse(event.body);
  console.log(event);
  if (!checkPhone(reqBody.cust_phone)) {return callback(
    null,
    response(400, {
      error: 'cust_phone is not valid'
    })
  );
  }
  if (!checkPhone(reqBody.shop_phone)) {return callback(
    null,
    response(400, {
      error: 'shop_phone is not valid'
    })
  );
  }
  if (
    !reqBody.cust_phone ||
    reqBody.cust_phone.trim() === '' ||
    !reqBody.shop_phone ||
    reqBody.shop_phone.trim() === ''
  ) {
    return callback(
      null,
      response(400, {
        error: 'cust_phone and shop_phone must not be empty'
      })
    );
  }

  const customer = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    cust_phone: reqBody.cust_phone,
    shop_phone: reqBody.shop_phone,
    cust_address: reqBody.cust_address,
    shop_address: reqBody.shop_address,
    product_price: reqBody.product_price,
    product_name: reqBody.product_name
  };

  return db
    .put({
      TableName: customerTable,
      Item: customer
    })
    .promise()
    .then(() => {
      callback(null, response(201, customer));
    })
    .catch((err) => response(null, response(err.statusCode, err)));
};
// Get customers
module.exports.getCustomers = (event, context, callback) => {
  const numberOfCust = event.pathParameters.number;
  console.log('numberOfCust: '+numberOfCust);
  console.log(event);
  const params = {
    TableName: customerTable,
    Limit: numberOfCust
  };
  return db
    .scan(params)
    .promise()
    .then((res) => {
      res.Items.sort(sortByDate);
      callback(null, response(200, res));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};

module.exports.getCustomer = (event, context, callback) => {
  const phone = event.pathParameters.phone;
  console.log('phone: '+phone);
  console.log(event);
  const params = {
    TableName: customerTable,
    FilterExpression: 'contains(cust_phone,:phone)',
    ExpressionAttributeValues: { ':phone' : phone}
  };
  return db
    .scan(params)
    .promise()
    .then((res) => {
      res.Items.sort(sortByDate);
      callback(null, response(200, res));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
//Update customer
module.exports.updateCustomer = (event, context, callback) => {
  const id = event.pathParameters.id;
  const reqBody = JSON.parse(event.body);
  console.log('reqBody'+reqBody)
  const params = {
    Key: {
      id: id
    },
    TableName: customerTable,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: 'SET cust_phone = :cust_phone, shop_phone = :shop_phone',
    ExpressionAttributeValues: {
      ':cust_phone': reqBody.cust_phone,
      ':shop_phone': reqBody.shop_phone
    },
    ReturnValues: 'ALL_NEW'
  };
  console.log('Updating');

  return db
    .update(params)
    .promise()
    .then((res) => {
      console.log(res);
      callback(null, response(200, res.Attributes));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};

// Delete a customer
module.exports.deleteCustomer = (event, context, callback) => {
  const id = event.pathParameters.id;
  const params = {
    Key: {
      id: id
    },
    TableName: customerTable
  };
  return db
    .delete(params)
    .promise()
    .then(() =>
      callback(null, response(200, { message: 'Customer deleted successfully' }))
    )
    .catch((err) => callback(null, response(err.statusCode, err)));
};