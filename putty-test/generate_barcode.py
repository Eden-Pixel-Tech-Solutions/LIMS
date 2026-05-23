import barcode
from barcode.writer import ImageWriter
from PIL import Image, ImageDraw, ImageFont

# --------------------------
# INPUT FROM CONSOLE
# --------------------------

sample_id = input("Enter Sample ID: ")
name = input("Enter Patient Name: ")
sex = input("Enter Sex (M/F): ")
age = input("Enter Age: ")

# --------------------------
# BARCODE DATA
# --------------------------
# ONLY SAMPLE ID INSIDE BARCODE
# Recommended for analyzers

barcode_data = sample_id

# If you REALLY want everything inside barcode:
# barcode_data = f"{sample_id}|{name}|{sex}|{age}Y"

# --------------------------
# GENERATE BARCODE
# --------------------------

Code128 = barcode.get_barcode_class('code128')

barcode_obj = Code128(
    barcode_data,
    writer=ImageWriter()
)

barcode_filename = barcode_obj.save("temp_barcode")

# --------------------------
# OPEN GENERATED BARCODE
# --------------------------

barcode_img = Image.open(barcode_filename)

# --------------------------
# CREATE NEW LABEL IMAGE
# --------------------------

label_width = barcode_img.width
label_height = barcode_img.height + 140

label = Image.new(
    "RGB",
    (label_width, label_height),
    "white"
)

# Paste barcode
label.paste(barcode_img, (0, 0))

# --------------------------
# DRAW TEXT
# --------------------------

draw = ImageDraw.Draw(label)

try:
    font_big = ImageFont.truetype("arial.ttf", 24)
    font_small = ImageFont.truetype("arial.ttf", 20)
except:
    font_big = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Center helper
def center_text(text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    return (label_width - text_width) // 2

# Patient Name
draw.text(
    (center_text(name, font_big), barcode_img.height + 10),
    name,
    fill="black",
    font=font_big
)

# Sex + Age
details = f"{sex} / {age}Y"

draw.text(
    (center_text(details, font_small), barcode_img.height + 45),
    details,
    fill="black",
    font=font_small
)

# Sample ID
sample_text = f"Sample ID: {sample_id}"

draw.text(
    (center_text(sample_text, font_small), barcode_img.height + 80),
    sample_text,
    fill="black",
    font=font_small
)

# --------------------------
# SAVE FINAL LABEL
# --------------------------

final_file = f"{sample_id}_label.png"

label.save(final_file)

print("\nLabel Generated Successfully")
print("Saved As:", final_file)