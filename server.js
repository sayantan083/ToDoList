const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

mongoose.connect('mongodb+srv://sayantan-panda:test123@cluster0.axdyg.mongodb.net/ToDoList?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name required!"]
    }
});

const item = mongoose.model("item", itemSchema);

const item1 = {
    name: "Welcome!"
};

const item2 = {
    name: "Type and press '+' to add new items"
};

const item3 = {
    name: "<-- Click the checkbox to delete an item"
};

const defaultItems = [item1, item2, item3];

const listSchema = mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const list = mongoose.model("list", listSchema);

app.use(bodyParser.urlencoded("encoded:true"));
app.use(express.static("public"));

app.set('view engine', 'ejs');

//Rendering items
app.get("/", (req, res) => {

    item.find((err, currentItems) => {
        if (err)
            console.log(err);
        else {
            if (currentItems.length === 0) {
                item.insertMany(defaultItems, (err) => {
                    if (err)
                        console.log(err);
                    else {
                        console.log("Three default items inserted succesfully");
                        return res.redirect("/");
                    }
                });
            }
            else{
                console.log("Find executed successfully");
                return res.render("list", { listTitle: "Today", kindofitems: currentItems });
            }
        }
    });
});

//Create or show new lists dynamically
app.get("/:listName", (req, res) => {

    const listName = _.capitalize(req.params.listName);

    list.findOne({ name: listName }, (err, result) => {
        if (err)
            console.log(err);
        else {
            if (!result) {
                const newList = {
                    name: listName,
                    items: defaultItems
                }
                list.create(newList, (err) => {
                    if (err)
                        console.log(err);
                    else
                        console.log("New list added succesfully");
                    return res.redirect("/" + listName);
                });
            }
            else {
                return res.render("list", { listTitle: result.name, kindofitems: result.items });
            }
        }
    });
});


//Saving items into database 
app.post("/", (req, res) => {

    const taskName = req.body.newTask;
    const title = _.capitalize(req.body.list)
    if (title === "Today") {
        item.create({ name: taskName }, (err) => {
            if (err)
                console.log(err);
            else
                console.log("item added succesfully");
        });
        return res.redirect("/");
    }
    else {
        list.findOne({ name: title }, (err, resultList) => {
            if (err)
                console.log(err);
            else {
                const newItem = {
                    name: taskName
                }
                resultList.items.push(newItem);
                resultList.save();
                console.log("Item added to " + resultList.name + " list successfully");
                return res.redirect("/"+title);
            }
        });
    }

});

//Deleting items
app.post("/delete", (req, res) => {

    const title = _.capitalize(req.body.list);
    const idToRemove = req.body.checkbox;

    if ( title === "Today") {

        item.findByIdAndRemove(idToRemove, (err) => {
            if (err)
                console.log(err);
            else {
                console.log("Id successfully removed");
                return res.redirect("/");
            }
        });
    }
    else {

        list.findOne({ name: title }, (err, result) => {
            if (err)
                console.log(err);
            else {
                result.items = result.items.filter((item) => {
                    return item._id!=idToRemove;
                });
                result.save();
                console.log("Id successfully removed");
                return res.redirect("/"+title);
            }
        })
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});