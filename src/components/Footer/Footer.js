/*!

=========================================================
* Vision UI Free Chakra - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/vision-ui-free-chakra
* Copyright 2021 Creative Tim (https://www.creative-tim.com/)
* Licensed under MIT (https://github.com/creativetimofficial/vision-ui-free-chakra/blob/master LICENSE.md)

* Design and Coded by Simmmple & Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

/*eslint-disable*/
import React from "react";
import { Flex, Link, List, ListItem, Text } from "@chakra-ui/react";

export default function Footer(props) {
  return (
    <Flex
      flexDirection={{
        base: "column",
        xl: "row",
      }}
      alignItems={{
        base: "center",
        xl: "start",
      }}
      justifyContent='space-between'
      px='30px'
      pb='20px'>
      <Text
        fontSize='sm'
        color='white'
        textAlign={{
          base: "center",
          xl: "start",
        }}
        mb={{ base: "20px", xl: "0px" }}>
        &copy; {1900 + new Date().getYear()},{" "}
        <Text as='span'>
          {document.documentElement.dir === "rtl"
            ? ""
            : "Made with "}
        </Text>
        <Link href='https://www.instagram.com/ggerrio/' target='_blank'>
          {document.documentElement.dir === "rtl"
            ? " توقيت الإبداعية"
            : "DeathG "}
        </Link>
        &
        <Link href='https://www.instagram.com/ggerrio/' target='_blank'>
          {document.documentElement.dir === "rtl" ? "سيممبل " : " DSG Team "}
        </Link>
        {document.documentElement.dir === "rtl"
          ? "للحصول على ويب أفضل"
          : "  IOT Tropidolaemus SP."}
      </Text>
      <List display='flex'>
        <ListItem
          me={{
            base: "20px",
            md: "44px",
          }}>
          <Link color='white' fontSize='sm' href='https://github.com/G-Vengeance'>
            {document.documentElement.dir === "rtl"
              ? "توقيت الإبداعية"
              : "Github"}
          </Link>
        </ListItem>
        <ListItem
          me={{
            base: "20px",
            md: "44px",
          }}>
          <Link color='white' fontSize='sm' href='https://open.spotify.com/user/21jxlsy7axqxtewsqmijhoz5a?si=LJsb1KwtTLG4hdoOFlTZTg&nd=1&dlsi=33379d4ff5a148bc'>
            {document.documentElement.dir === "rtl" ? "سيممبل" : "Spotify"}
          </Link>
        </ListItem>
        <ListItem
          me={{
            base: "20px",
            md: "44px",
          }}>
          <Link
            color='white'
            fontSize='sm'
            href='https://id.wikipedia.org/wiki/Bandotan_candi'>
            {document.documentElement.dir === "rtl" ? "مدونة" : "Blog"}
          </Link>
        </ListItem>
        <ListItem>
          <Link
            color='white'
            fontSize='sm'
            href='dsgreptileiot@gmail.com'>
            {document.documentElement.dir === "rtl" ? "رخصة" : "Email"}
          </Link>
        </ListItem>
      </List>
    </Flex>
  );
}

