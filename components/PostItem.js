import React, { useState, useEffect } from "react";
import { db, storage, auth } from "../config/fire-config";
import { Form, Button, Col, Row, Image, InputGroup } from "react-bootstrap";
import PhoneInput from "react-phone-number-input/input";
import Router from "next/router";
import style from "../styles/Home.module.css";
import { doc, setDoc } from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { RiCloseCircleFill } from "react-icons/ri";
import { TailSpin } from "react-loader-spinner";

const PostItem = ({ back }) => {
  const [freeItem, setFreeItem] = useState(false);
  const [postId, setPostId] = useState("");
  const [data, setData] = useState({
    title: "",
    category: "",
    zip: "",
    email: "",
    price: "",
    userId: "",
    imageUrls: "",
    description: ""
  });
  const [phoneNumber, setPhoneNumber] = useState(undefined);
  const [imageTitles, setImageTitles] = useState([]);
  const [displayUrl, setDisplayUrl] = useState([]);
  const [progress, setProgress] = useState("getUpload");
  const [agreedToTermsAndConditions, setAgreedtoTermsAndConditions] = useState(
    false
  );
  const [currUser, setCurrUser] = useState("");
  let uniqueId = require('lodash.uniqueid')
 

  onAuthStateChanged(
    auth,
    user => (user ? setCurrUser(user) : setCurrUser(""))
  );

  useEffect(
    () => {
      setPostId(
        data.category ? data.category + Math.random().toString(36).slice(2) : ""
      );
    },
    [data.category]
  );

  const toggleFree = () => {
    setFreeItem(!freeItem);
    setData({ ...data, price: 0 });
  };

  const agreeToTerms = () =>
    setAgreedtoTermsAndConditions(!agreedToTermsAndConditions);

  const deleteImage = (url) => {
    setDisplayUrl(displayUrl.filter(imageurl=> imageurl !== url))
    const deleteRef = ref(storage, url);
    deleteObject(deleteRef)
      .then(() => {
        console.log("picture deleted");
      })
      .catch(error => {
        console.error("error occurd: ", error);
      });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    await setDoc(doc(db, "posts", postId), {
      title: data.title,
      zip: data.zip,
      email: data.email,
      phone: phoneNumber,
      category: data.category,
      price: data.price,
      description: data.description,
      imageUrls: displayUrl,
      postDate: new Date(),
      userId: currUser.uid,
      userName: currUser.displayName,
      userImage: currUser.photoURL
    })
      .then(doc => {
        setData({
          title: "",
          category: "",
          zip: "",
          email: "",
          phone: "",
          price: "",
          description: ""
        });
        setDisplayUrl([]);
        setImageTitles([]);
        setPhoneNumber(undefined);
        setProgress("getUpload");
        console.log("document written: ", postId);
        back(false)
      })
      .catch(error => {
        console.error("Error adding Document: ", error);
      });
  };
  const displayImages = (dUrl) =>{
    return(
    <div className={style.imageContainer}>
    {dUrl.map(srcUrl => {
      return (
        <div className={style.imageDiv}>
          <div >
          <RiCloseCircleFill
            style={{
              fill: "#ef9d06",
              position: "absolute",
              top: '20px',
              right: '20px',
              zIndex: '100',
              cursor: "pointer"
            }}
            onClick={()=>deleteImage(srcUrl)}
          />
          </div>
          <Image
            key={uniqueId("image_")}
            src={srcUrl}
            alt={srcUrl}
            height={100}
            width={100}
            className={style.postImage}
            onClick={()=>{console.log('image clicked')}}
            
          />
         
        </div>
      );
    })}
          {
            progress==='uploading'? 
            ( <div className={style.loader}> 
                <TailSpin 
                color="#ef9d06" 
                  height={40} 
                  width={40} 
                />
              </div>):
              <></>
          }
  </div>
    )
  }

  const imageContent = () => {
    switch (progress) {
      case "getUpload":
        return <div>
          Upload Pictures
        </div>;
      case "uploading":
        return (<div>
          {displayUrl?displayImages(displayUrl):"" }
          </div>);
      case "uploaded":
        return (
         <div>
            {displayUrl?displayImages(displayUrl): ""}
         </div>
        );
      case "failedUpload":
        return <div> Upload failed </div>;
    }
  };
  const handleImageUpload = e => {
    if (data.category) {
      const image = e.target.files[0];
      setImageTitles([...imageTitles, image.name]);
      const imageRef = ref(storage, `postImages/${image.name}`);
      const uploadImages = uploadBytesResumable(imageRef, image);
      uploadImages.on(
        "state_changed",
        snapshot => {
          const process = snapshot.bytesTransferred / snapshot.totalBytes * 100;
          console.log("uploading", process);
          setProgress("uploading");
        },
        error => {
          console.log("Encounter ", error);
        },
        () => {
          getDownloadURL(ref(storage, `postImages/${image.name}`)).then(url => {
            setDisplayUrl([...displayUrl, url]);
            setProgress("uploaded");
          });
        }
      );
    } else {
      alert("Please provide post details first. Thank you");
    }
  };

  return (
    <div>
      <div className={style.inputContainer}>
        <h1 className="d-flex justify-content-center mt-4">Post an Item</h1>
        {/* Post item form and validation */}
        <Form className={style.InputField}
          onSubmit={handleSubmit}
          validated={
            data.title &&
            data.category &&
            data.zip &&
            data.email &&
            phoneNumber &&
            data.price &&
            data.description &&
            agreedToTermsAndConditions
              ? true
              : false
          }
        >
          <Form.Group className="my-2 align-item-center" controlId="formTitle">
            <Row>
              <Col md="2" className="d-flex align-items-center">
                <Form.Label className="mb-0">Title:</Form.Label>
              </Col>
              <Col md="10">
                <Form.Control
                  value={data.title}
                  required
                  type="text"
                  placeholder="Item Name"
                  min-length={4}
                  onChange={e => setData({ ...data, title: e.target.value })}
                />
                <Form.Control.Feedback type="invalid">
                  Please provide item name.
                </Form.Control.Feedback>
              </Col>
            </Row>
          </Form.Group>

          <Form.Group controlId="itemCategoryValidation" className="my-2">
            <Row>
              <Col md="2" className="d-flex align-items-center">
                <Form.Label>Category:</Form.Label>
              </Col>
              <Col md="10">
                <Form.Select
                  aria-label="item-category"
                  required
                  onChange={e => setData({ ...data, category: e.target.value })}
                  value={data.category}
                >
                  <option>Select a category</option>
                  <option value="appliance"> Appliance </option>
                  <option value="babyAndKids">Baby and Kids</option>
                  <option value="clothing"> Clothing </option>
                  <option value="electronics"> Electronics</option>
                  <option value="furniture"> Furniture </option>
                  <option value="garden"> Garden </option>
                  <option value="homeDecor"> Home Decor </option>
                  <option value="tools"> Tools </option>
                  <option value="toysAndGames"> Toys and Games </option>
                  <option value="vehicles"> Vehicles </option>
                  <option value="others"> Others </option>
                </Form.Select>
              </Col>
            </Row>
          </Form.Group>
          <Form.Control.Feedback type="invalid">
            Please choose a catagory.
          </Form.Control.Feedback>
          <Form.Group
            controlId="itemOwnerZipValidation"
            className="my-2 justify-content-center"
          >
            <Row>
              <Col md="2" className="d-flex align-items-center">
                <Form.Label className="mb-0">Zip:</Form.Label>
              </Col>
              <Col md="10">
                <Form.Control
                  value={data.zip}
                  type="zip"
                  placeholder="00000"
                  minLength={5}
                  maxLength={10}
                  required
                  onChange={e => setData({ ...data, zip: e.target.value })}
                />
              </Col>
            </Row>
          </Form.Group>
          <Form.Control.Feedback type="invalid">
            Please provide a valid zip of your address.
          </Form.Control.Feedback>
          <Form.Group controlId="itemOwnerEmailValidation" className="my-2">
            <Row>
              <Col md="2" className="d-flex align-items-center">
                <Form.Label className="mb-0">Email:</Form.Label>
              </Col>
              <Col md="10">
                <Form.Control
                  value={data.email}
                  type="email"
                  placeholder="example@domain.com"
                  onChange={e => setData({ ...data, email: e.target.value })}
                  required
                />
              </Col>
            </Row>
          </Form.Group>
          <Form.Control.Feedback type="invalid">
            Please provide a valid Email.
          </Form.Control.Feedback>

          <Form.Group controlId="itemOwnerPhoneValidation" className="my-2">
            <Row>
              <Col md="2" className="d-flex align-items-center">
                <Form.Label className="mb-0">Phone:</Form.Label>
              </Col>
              <Col md="10">
                <PhoneInput
                  value={phoneNumber}
                  type="phone"
                  withCountryCallingCode
                  placeholder="(000) 000-0000"
                  country="US"
                  required
                  onChange={setPhoneNumber}
                  maxLength={14}
                  className="form-control"
                />
              </Col>
            </Row>
          </Form.Group>
          <Form.Control.Feedback type="invalid">
            Please provide a valid Phone number.
          </Form.Control.Feedback>
          <Form.Group controlId="itemPriceValidation" className="my-2">
            <Row>
              <Col md="2" className="d-flex align-items-center">
                <Form.Label className="mb-0">Price:</Form.Label>
              </Col>
              <Col md="8">
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    defaultValue={data.price}
                    type="number"
                    placeholder="00.00"
                    required
                    disabled={freeItem ? true : false}
                    onChange={e =>
                      setData({
                        ...data,
                        price: e.target.value
                          ? parseFloat(e.target.value.trim().replace(" ", ""))
                          : ""
                      })}
                    className="form-control"
                  />
                </InputGroup>
              </Col>
              <Col
                md="2"
                className="d-flex justify-content-center align-items-center "
              >
                <Form.Check label="Free" onChange={toggleFree} />
              </Col>
            </Row>
          </Form.Group>

          <Form.Group controlId="itemDescriptionValidation" className="my-2">
            <Row>
              <Col md="2">
                <Form.Label className="mb-0">Description:</Form.Label>
              </Col>
              <Col md="10">
                <Form.Group>
                  <Form.Control
                    value={data.description}
                    as="textarea"
                    placeholder="Description"
                    rows={4}
                    area-describedby="descriptionHelp"
                    onChange={e =>
                      setData({ ...data, description: e.target.value })}
                  />
                  <Form.Text id="descriptionHelp" muted>
                    Providing description is optional. However, items with
                    detaild description sell faster!
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form.Group>

          <Form.Group className="my-2">
            <Row>
              <Col md="2">
                <Form.Label className="mt-2">Add photos: </Form.Label>
              </Col>
              <Col md="10">
                <Form.Control
                  type="file"
                  inputMode="no"
                  required
                  name="image"
                  onChange={e => {
                    handleImageUpload(e);
                  }}
                  
                  area-describedby="fileDescription"
                />

                <Form.Text id="fileDescription" muted>
                  Add your cover photo first. Please provide accurate and
                  detailed pictures.
                </Form.Text>
              </Col>
            </Row>
          </Form.Group>
          <Form.Group />
          <Row>
            <Col md="2" />
            <Col md="10">
              {imageContent()}
            </Col>
          </Row>
          <Form.Group className="d-flex flex-column justify-content-">
            <Row>
              <Col md="2" />
              <Col md="10">
                <Form.Check
                  required
                  name="terms"
                  label="Agree to terms and conditions"
                  onChange={agreeToTerms}
                />
              </Col>
            </Row>
            <Row>
              <Col md="8" />
              <Col md="2">
                <Button
                  variant="warning"
                  onClick={() => {
                    imageTitles.map(name => {
                      deleteRef = ref(storage, name);
                      deleteObject(deleteRef)
                        .then(() => {
                          console.log("picture deleted");
                        })
                        .catch(error => {
                          console.error("error occurd: ", error);
                        });
                    });
                    back(false);
                  }}
                >
                  Cancel
                </Button>
              </Col>
              <Col md="2">
                <Button type="submit">POST IT</Button>
              </Col>
            </Row>
          </Form.Group>
        </Form>
      </div>
    </div>
  );
};

export default PostItem;
