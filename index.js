var express = require('express');
var app = express();
var _findIndex = require('lodash/findIndex') // npm install lodash --save
var server = require('http').Server(app);
var port = (process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 6969);
var io = require('socket.io')(server);
let axios = require('axios')
server.listen(port, () => console.log('Server running in port ' + port));

var userOnline = []; //danh sách user dang online
io.on('connection', function(socket) {
    console.log(socket.id + ': connected');
    //lắng nghe khi người dùng thoát
    socket.on('disconnect', function() {
        console.log(socket.id + ': disconnected')
        $index = _findIndex(userOnline, ['id', socket.id]);
        userOnline.splice($index, 1);
        io.sockets.emit('updateUserList', userOnline);
    })
    //lắng nghe khi có người gửi tin nhắn
    socket.on('newMessage', data => {
        //gửi lại tin nhắn cho tất cả các user dang online
        io.sockets.emit('newMessage', {
            data: data.data,
            user: data.user
        });
    })
    socket.on('newMessageFromChatbot' ,async data=>{
        let chatbotRes;
        //gửi lại tin nhắn cho tất cả các user dang online
        await axios.post('http://localhost:5002/webhooks/rest/webhook', {
            "message": data.data
        }).then(res=>{
            chatbotRes=res.data[0].text
            console.log(chatbotRes)
        })
        io.sockets.emit('newMessageFromChatbot', {
            data: chatbotRes,
            user: data.user
        });
    })
    //lắng nghe khi có người login
    socket.on('login', data => {
        // kiểm tra xem tên đã tồn tại hay chưa
        if (userOnline.indexOf(data) >= 0) {
            socket.emit('loginFail'); //nếu tồn tại rồi thì gửi socket fail
        } else {
            // nếu chưa tồn tại thì gửi socket login thành công
            socket.emit('loginSuccess', data);
            userOnline.push({
                id: socket.id,
                name: data
            })
            io.sockets.emit('updateUserList', userOnline);// gửi danh sách user dang online
        }
    })

});
