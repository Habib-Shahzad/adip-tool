import './FlipText.css';


const FlipText = (props) => {
    return (
        <div className='flip-text-container'>
            <div className={`waviy ${props.classes}`}>
                {
                    props.text.split('').map((char, index) => {
                        return (
                            <span style={{ "--i": (index + 1) }}>{char}</span>
                        )
                    }
                    )
                }

            </div>

        </div>
    )
}

export default FlipText;